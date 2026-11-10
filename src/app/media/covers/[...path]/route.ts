import { NextResponse } from "next/server";
import { getPublicSupabaseConfig } from "@/lib/env/public";

// serve public covers through the app so browser previews never need access to the private local supabase port
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.length !== 2 || path.some(segment => !/^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(segment) || segment.includes(".."))) return new NextResponse(null, { status: 404 });
  const config = getPublicSupabaseConfig();
  if (!config) return new NextResponse(null, { status: 503 });
  const url = new URL(`/storage/v1/object/public/covers/${path.map(encodeURIComponent).join("/")}`, config.supabaseUrl);
  try {
    const upstream = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    const mime = upstream.headers.get("content-type")?.split(";")[0];
    if (!upstream.ok || !mime || !["image/jpeg", "image/png", "image/webp"].includes(mime)) return new NextResponse(null, { status: 404 });
    const length = Number(upstream.headers.get("content-length"));
    if (length > 5 * 1024 * 1024) return new NextResponse(null, { status: 404 });
    return new NextResponse(upstream.body, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
