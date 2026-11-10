import { listPublicCategories } from "@/features/blog/server";
import { dataResponse, errorResponse } from "@/lib/http/json";

// avoid caching taxonomy that may only be attached to an unpublished article
export const dynamic = "force-dynamic";

// reveal only categories connected to currently public content
export async function GET() {
  try { return dataResponse(await listPublicCategories()); }
  catch (error) { return errorResponse(error); }
}
