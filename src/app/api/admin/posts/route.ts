import { createAdminPost, listAdminPosts, revalidateBlogPaths } from "@/features/blog/server";
import { adminListQuerySchema, createPostSchema } from "@/features/blog/schemas";
import { HttpError } from "@/lib/http/error";
import { dataResponse, errorResponse } from "@/lib/http/json";
import { hasSameOrigin, readJsonBody } from "@/lib/http/request";
import { parseInput } from "@/lib/http/validation";

// keep private editorial collections request scoped and uncached
export const dynamic = "force-dynamic";

// give editors a bounded searchable collection without redirecting api clients to html
export async function GET(request: Request) {
  try { return dataResponse(await listAdminPosts(parseInput(adminListQuerySchema, Object.fromEntries(new URL(request.url).searchParams)))); }
  catch (error) { return errorResponse(error); }
}

// create content through the authenticated atomic service instead of exposing table writes to the browser
export async function POST(request: Request) {
  try {
    if (!hasSameOrigin(request)) throw new HttpError(403, "CSRF_ORIGIN_MISMATCH", "Mutation requests must come from this origin");
    const post = await createAdminPost(parseInput(createPostSchema, await readJsonBody(request)));
    revalidateBlogPaths([post.slug]);
    return dataResponse(post, 201);
  } catch (error) { return errorResponse(error); }
}
