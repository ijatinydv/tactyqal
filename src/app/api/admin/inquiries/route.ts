import { listConsultationInquiries } from "@/features/consultations/server";
import { consultationListQuerySchema } from "@/features/consultations/schemas";
import { dataResponse, errorResponse } from "@/lib/http/json";
import { parseInput } from "@/lib/http/validation";

// keep the private inquiry collection request scoped and uncached
export const dynamic = "force-dynamic";

// provide editors a bounded inbox page after the service verifies their current role
export async function GET(request: Request) {
  try {
    const query = parseInput(consultationListQuerySchema, Object.fromEntries(new URL(request.url).searchParams));
    return dataResponse(await listConsultationInquiries(query));
  } catch (error) {
    return errorResponse(error);
  }
}
