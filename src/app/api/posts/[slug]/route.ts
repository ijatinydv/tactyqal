import { getPublishedPost } from "@/features/blog/server";
import { HttpError } from "@/lib/http/error";
import { dataResponse, errorResponse } from "@/lib/http/json";

// ensure unpublishing or deletion immediately removes public access to the article
export const dynamic = "force-dynamic";

// make missing and unpublished slugs indistinguishable through the public api
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const post = await getPublishedPost((await params).slug);
    if (!post) throw new HttpError(404, "NOT_FOUND", "Post not found");
    return dataResponse(post);
  } catch (error) { return errorResponse(error); }
}
