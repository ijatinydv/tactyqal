import { describe, expect, it } from "vitest";
import { coverFileSchema, matchesRasterSignature, MAX_COVER_BYTES } from "./validation";

// protect the upload boundary from active content and misleading browser supplied metadata
 describe("cover validation", () => {
  // keep public covers bounded even when the application receives a forged file description
  it("rejects oversized and unsupported upload metadata", () => {
    expect(coverFileSchema.safeParse({ size: MAX_COVER_BYTES + 1, type: "image/png" }).success).toBe(false);
    expect(coverFileSchema.safeParse({ size: 10, type: "image/svg+xml" }).success).toBe(false);
    expect(coverFileSchema.safeParse({ size: 0, type: "image/jpeg" }).success).toBe(false);
  });
  // ensure a filename or declared image mime alone cannot turn html into a raster cover
  it("checks actual signatures instead of trusting extensions", () => {
    expect(matchesRasterSignature(new TextEncoder().encode("<html>unsafe</html>"), "image/png")).toBe(false);
    expect(matchesRasterSignature(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), "image/png")).toBe(true);
    expect(matchesRasterSignature(new Uint8Array([255, 216, 255]), "image/jpeg")).toBe(true);
  });
});
