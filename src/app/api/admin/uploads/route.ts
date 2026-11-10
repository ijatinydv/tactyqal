import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSameOrigin } from "@/lib/http/request";
import { coverFileSchema, matchesRasterSignature, MAX_COVER_BYTES } from "@/features/media/validation";

// keep expensive raster decoding out of edge runtimes with incompatible native module support
export const runtime = "nodejs";

// ensure mutation feedback and auth cookies cannot be reused across editorial sessions
function reply(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "private, no-store" } });
}

// accept only authenticated editor covers after checking origin size and actual decoded raster bytes
export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return reply({ error: { code: "FORBIDDEN", message: "Upload requests must originate from this application." } }, 403);
  const client = await createServerSupabaseClient();
  if (!client) return reply({ error: { code: "UNAVAILABLE", message: "Media storage is not configured." } }, 503);
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity.user) return reply({ error: { code: "UNAUTHENTICATED", message: "Please sign in again." } }, 401);
  const { data: profile, error: profileError } = await client.from("profiles").select("role").eq("id", identity.user.id).maybeSingle();
  if (profileError || profile?.role !== "editor") return reply({ error: { code: "FORBIDDEN", message: "Editor access is required." } }, 403);
  const length = Number(request.headers.get("content-length"));
  if (!length || length > MAX_COVER_BYTES + 65536) return reply({ error: { code: "INVALID_UPLOAD", message: "Choose an image no larger than 5 MiB." } }, 413);
  let file: File;
  try {
    const value = (await request.formData()).get("file");
    if (!(value instanceof File) || !coverFileSchema.safeParse(value).success) return reply({ error: { code: "INVALID_UPLOAD", message: "Choose a JPEG, PNG, or WebP image up to 5 MiB." } }, 422);
    file = value;
  } catch {
    return reply({ error: { code: "INVALID_UPLOAD", message: "The image could not be read. Please choose it again." } }, 422);
  }
  let normalized: Buffer;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesRasterSignature(bytes, file.type)) throw new Error("Unsupported raster signature");
    normalized = await sharp(bytes, { limitInputPixels: 20_000_000, animated: false, failOn: "warning" }).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (normalized.length > MAX_COVER_BYTES) throw new Error("Output exceeds cover limit");
  } catch {
    return reply({ error: { code: "INVALID_UPLOAD", message: "This file is not a supported image, is damaged, or exceeds the pixel limit." } }, 422);
  }
  const path = `${identity.user.id}/${randomUUID()}.webp`;
  const { error } = await client.storage.from("covers").upload(path, normalized, { contentType: "image/webp", upsert: false });
  if (error) return reply({ error: { code: "UPLOAD_FAILED", message: "The cover could not be stored. Your article text has not changed; please retry." } }, 503);
  return reply({ data: { path, url: `/media/covers/${path}` } }, 201);
}
