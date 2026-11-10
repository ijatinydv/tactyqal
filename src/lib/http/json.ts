import { NextResponse } from "next/server";
import { HttpError } from "./error";

// return uniform no-store success envelopes for browser and service clients
export function dataResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status, headers: { "Cache-Control": "no-store" } });
}

// avoid leaking database errors while preserving expected client error details
export function errorResponse(error: unknown): NextResponse {
  const known = error instanceof HttpError ? error : null;
  const payload = {
    error: {
      code: known?.code ?? "INTERNAL_ERROR",
      message: known?.message ?? "The request could not be completed",
      ...(known?.fields ? { fields: known.fields } : {}),
    },
  };

  return NextResponse.json(payload, {
    status: known?.status ?? 500,
    headers: { "Cache-Control": "no-store" },
  });
}
