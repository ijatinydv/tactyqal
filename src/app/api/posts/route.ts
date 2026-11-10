import { listPublishedPosts } from "@/features/blog/server";
import { publicListQuerySchema } from "@/features/blog/schemas";
import { dataResponse, errorResponse } from "@/lib/http/json";
import { parseInput } from "@/lib/http/validation";

// keep publication visibility current without rebuilding the public api
export const dynamic = "force-dynamic";

// expose bounded published summaries without sharing session cookies or draft content
export async function GET(request: Request) {
  try { return dataResponse(await listPublishedPosts(parseInput(publicListQuerySchema, Object.fromEntries(new URL(request.url).searchParams)))); }
  catch (error) { return errorResponse(error); }
}
