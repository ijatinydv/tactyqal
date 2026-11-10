import { deleteAdminPost, getAdminPost, patchAdminPost, revalidateBlogPaths } from "@/features/blog/server";
import { patchPostSchema } from "@/features/blog/schemas";
import { HttpError } from "@/lib/http/error";
import { dataResponse, errorResponse } from "@/lib/http/json";
import { hasSameOrigin, readJsonBody } from "@/lib/http/request";
import { parseInput } from "@/lib/http/validation";

// retain a stable internal record identity while the public slug may change
 type Params = { params: Promise<{ id: string }> };

// prevent personalised draft records from being cached by shared intermediaries
export const dynamic = "force-dynamic";

// load a saved draft only through the database authorised editorial service
export async function GET(_request: Request, { params }: Params) {
  try {
    const post = await getAdminPost((await params).id);
    if (!post) throw new HttpError(404, "NOT_FOUND", "Post not found");
    return dataResponse(post);
  } catch (error) { return errorResponse(error); }
}

// persist validated edits atomically and invalidate both old and new public addresses
export async function PATCH(request: Request, { params }: Params) {
  try {
    if (!hasSameOrigin(request)) throw new HttpError(403, "CSRF_ORIGIN_MISMATCH", "Mutation requests must come from this origin");
    const id = (await params).id;
    const previous = await getAdminPost(id);
    if (!previous) throw new HttpError(404, "NOT_FOUND", "Post not found");
    const post = await patchAdminPost(id, parseInput(patchPostSchema, await readJsonBody(request)));
    revalidateBlogPaths([previous.slug, post.slug]);
    return dataResponse(post);
  } catch (error) { return errorResponse(error); }
}

// require a deliberate authenticated mutation before removing a saved post and its category links
export async function DELETE(request: Request, { params }: Params) {
  try {
    if (!hasSameOrigin(request)) throw new HttpError(403, "CSRF_ORIGIN_MISMATCH", "Mutation requests must come from this origin");
    const deleted = await deleteAdminPost((await params).id);
    revalidateBlogPaths([deleted.slug]);
    return dataResponse(deleted);
  } catch (error) { return errorResponse(error); }
}
