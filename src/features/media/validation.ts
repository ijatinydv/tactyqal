import { z } from "zod";

// bound uploads before decoding image pixels or forwarding bytes to storage
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

// constrain the public media surface to the three supported raster image formats
export const coverFileSchema = z.object({
  size: z.number().int().positive().max(MAX_COVER_BYTES),
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

// reject an obvious extension or mime disguise before the full raster decoder inspects the image
export function matchesRasterSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (mime === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}
