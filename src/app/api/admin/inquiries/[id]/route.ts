import { consultationIdSchema, patchConsultationSchema } from "@/features/consultations/schemas";
import { deleteConsultationInquiry, updateConsultationInquiryStatus } from "@/features/consultations/server";
import { HttpError } from "@/lib/http/error";
import { dataResponse, errorResponse } from "@/lib/http/json";
import { hasSameOrigin, readJsonBody } from "@/lib/http/request";
import { parseInput } from "@/lib/http/validation";

// retain a stable private-record route identity
type Params = { params: Promise<{ id: string }> };

// prevent private inquiry mutations from entering shared response caches
export const dynamic = "force-dynamic";

// transition a validated inquiry through the editor-only workflow
export async function PATCH(request: Request, { params }: Params) {
  try {
    if (!hasSameOrigin(request)) throw new HttpError(403, "CSRF_ORIGIN_MISMATCH", "Mutation requests must come from this origin");
    const id = parseInput(consultationIdSchema, (await params).id);
    const input = parseInput(patchConsultationSchema, await readJsonBody(request, 4096));
    return dataResponse(await updateConsultationInquiryStatus(id, input.status));
  } catch (error) {
    return errorResponse(error);
  }
}

// permanently remove an inquiry through the editor-only retention control
export async function DELETE(request: Request, { params }: Params) {
  try {
    if (!hasSameOrigin(request)) throw new HttpError(403, "CSRF_ORIGIN_MISMATCH", "Mutation requests must come from this origin");
    const id = parseInput(consultationIdSchema, (await params).id);
    return dataResponse(await deleteConsultationInquiry(id));
  } catch (error) {
    return errorResponse(error);
  }
}
