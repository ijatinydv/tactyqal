import { submitConsultation } from "@/features/consultations/server";
import { submitConsultationSchema } from "@/features/consultations/schemas";
import { HttpError } from "@/lib/http/error";
import { dataResponse, errorResponse } from "@/lib/http/json";
import { hasSameOrigin, readJsonBody } from "@/lib/http/request";
import { parseInput } from "@/lib/http/validation";

// keep public submission uncached and expose no endpoint for retrieving receipts
export const dynamic = "force-dynamic";

// preserve a machine-readable cooldown for clients after durable database throttling
function submissionErrorResponse(error: unknown) {
  const response = errorResponse(error);
  if (error instanceof HttpError && error.status === 429) response.headers.set("Retry-After", "3600");
  return response;
}

// accept an adult consultation request without exposing stored private details
export async function POST(request: Request) {
  try {
    if (!hasSameOrigin(request)) throw new HttpError(403, "CSRF_ORIGIN_MISMATCH", "Mutation requests must come from this origin");
    const input = parseInput(submitConsultationSchema, await readJsonBody(request, 16_384));
    const receipt = await submitConsultation(input);
    return dataResponse(receipt, 201);
  } catch (error) {
    return submissionErrorResponse(error);
  }
}
