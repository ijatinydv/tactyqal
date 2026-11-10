import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "@/lib/http/error";
import type { Database } from "@/types/database.generated";
import type { Category, Post, SavePostInput } from "./types";

// keep database post fields local until the parent regenerates shared database types
type PostRecord = Omit<Post, "categories">;

// represent only the nested relation fields needed by blog response mapping
type PostCategoryLink = { post_id: string; category: Category | Category[] | null };

// translate expected postgres failures without exposing raw database messages
function throwDatabaseError(error: { code?: string }): never {
  if (error.code === "23505") throw new HttpError(409, "DUPLICATE_SLUG", "A post with this slug already exists", { slug: "This slug is already in use" });
  if (error.code === "23503") throw new HttpError(422, "INVALID_REFERENCE", "One or more selected categories do not exist");
  if (error.code === "23514" || error.code === "22023") throw new HttpError(422, "INVALID_POST", "Post data violates a database constraint");
  if (error.code === "42501") throw new HttpError(403, "FORBIDDEN", "You are not permitted to change editorial content");
  if (error.code === "P0002") throw new HttpError(404, "NOT_FOUND", "Post not found");
  throw new HttpError(503, "DATABASE_UNAVAILABLE", "Editorial data is temporarily unavailable");
}

// retrieve one post through the caller's public or editor RLS context
export async function findPostById(client: SupabaseClient<Database>, id: string): Promise<PostRecord | null> {
  const { data, error } = await client.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throwDatabaseError(error);
  return data ? data as unknown as PostRecord : null;
}

// resolve public slugs only after row-level security has filtered drafts
export async function findPostBySlug(client: SupabaseClient<Database>, slug: string): Promise<PostRecord | null> {
  const { data, error } = await client.from("posts").select("*").eq("slug", slug).maybeSingle();
  if (error) throwDatabaseError(error);
  return data ? data as unknown as PostRecord : null;
}

// batch-load visible categories so post responses never depend on implicit joins
export async function findCategoriesForPosts(client: SupabaseClient<Database>, postIds: string[]): Promise<Map<string, Category[]>> {
  const categoriesByPost = new Map<string, Category[]>();
  if (postIds.length === 0) return categoriesByPost;

  const { data, error } = await client.from("post_categories")
    .select("post_id, category:categories(id,name,slug)")
    .in("post_id", postIds);
  if (error) throwDatabaseError(error);

  for (const row of (data ?? []) as unknown as PostCategoryLink[]) {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    if (!category) continue;
    const assigned = categoriesByPost.get(row.post_id) ?? [];
    assigned.push(category);
    categoriesByPost.set(row.post_id, assigned);
  }
  for (const categories of categoriesByPost.values()) categories.sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
  return categoriesByPost;
}

// fetch categories through the active RLS context for public and admin views
export async function findCategories(client: SupabaseClient<Database>): Promise<Category[]> {
  const { data, error } = await client.from("categories").select("id,name,slug").order("name").order("id");
  if (error) throwDatabaseError(error);
  return (data ?? []) as Category[];
}

// resolve an exact category slug without expanding client-controlled filters
export async function findCategoryBySlug(client: SupabaseClient<Database>, slug: string): Promise<Category | null> {
  const { data, error } = await client.from("categories").select("id,name,slug").eq("slug", slug).maybeSingle();
  if (error) throwDatabaseError(error);
  return data as Category | null;
}

// find matching post identifiers using the category link table and its policies
// preserve nullable rpc inputs that generated function args currently model as non-null
export async function savePost(client: SupabaseClient<Database>, input: SavePostInput, postId: string | null): Promise<string> {
  const rpcClient = client as unknown as {
    rpc(name: string, args: Record<string, unknown>): PromiseLike<{
      data: unknown;
      error: { code?: string } | null;
    }>;
  };
  const { data, error } = await rpcClient.rpc("blog_save_post", {
    p_post_id: postId,
    p_title: input.title,
    p_slug: input.slug,
    p_excerpt: input.excerpt,
    p_content: input.content,
    p_status: input.status,
    p_cover_path: input.cover_path,
    p_cover_alt: input.cover_alt,
    p_category_ids: input.category_ids,
  });
  if (error) throwDatabaseError(error);
  if (typeof data !== "string") throw new HttpError(503, "DATABASE_UNAVAILABLE", "Editorial data is temporarily unavailable");
  return data;
}

// remove one editor-owned post and return a row count for not-found handling
export async function removePost(client: SupabaseClient<Database>, id: string): Promise<void> {
  const { data, error } = await client.from("posts").delete().eq("id", id).select("id").maybeSingle();
  if (error) throwDatabaseError(error);
  if (!data) throw new HttpError(404, "NOT_FOUND", "Post not found");
}
