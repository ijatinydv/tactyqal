import { listAdminCategories } from "@/features/blog/server";
import { dataResponse, errorResponse } from "@/lib/http/json";

// prevent editor taxonomy responses from being reused across sessions
export const dynamic = "force-dynamic";

// supply category choices only after the service verifies the editor role
export async function GET() {
  try { return dataResponse(await listAdminCategories()); }
  catch (error) { return errorResponse(error); }
}
