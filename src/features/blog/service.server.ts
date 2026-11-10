import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { HttpError } from "@/lib/http/error";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import { extractDocumentText, readingTimeMinutes } from "./content";
import {
  findCategories,
  findCategoriesForPosts,
  findCategoryBySlug,
  findPostById,
  findPostBySlug,
  removePost,
  savePost,
} from "./repository.server";
import { createPostSchema, validationFields } from "./schemas";
import type {
  AdminPostListOptions,
  Category,
  PatchPostInput,
  Post,
  PostList,
  PostSummary,
  PublicPostListOptions,
  SavePostInput,
} from "./types";

// carry a verified actor and request client through protected editorial work
export type BlogEditorContext = { user: User; client: SupabaseClient<Database> };

// retain the database fields needed to build complete post contracts
type PostRecord = Omit<Post, "categories">;

// provide one stable failure when trusted database configuration is unavailable
function unavailable(): HttpError {
  return new HttpError(503, "SERVICE_UNAVAILABLE", "Blog data is temporarily unavailable");
}

// verify identity and the database-owned editor role without redirecting api requests
export async function authenticateBlogEditor(): Promise<BlogEditorContext> {
  let client: SupabaseClient<Database> | null;
  try {
    client = await createServerSupabaseClient();
  } catch {
    throw unavailable();
  }
  if (!client) throw unavailable();

  let user: User | null = null;
  try {
    const identity = await client.auth.getUser();
    if (!identity.error) user = identity.data.user;
  } catch {
    user = null;
  }
  if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Sign in to access editorial content");

  try {
    const profile = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile.error) throw unavailable();
    if (profile.data?.role !== "editor") throw new HttpError(403, "FORBIDDEN", "Editor access is required");
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw unavailable();
  }
  return { user, client };
}

// create an anonymous client that cannot inherit request cookies or editor roles
function publicClient(): SupabaseClient<Database> {
  const client = createPublicSupabaseClient();
  if (!client) throw unavailable();
  return client;
}

// map database records and their RLS-visible categories into a complete post contract
async function withCategories(client: SupabaseClient<Database>, record: PostRecord): Promise<Post> {
  const categories = await findCategoriesForPosts(client, [record.id]);
  return { ...record, categories: categories.get(record.id) ?? [] };
}

// turn full posts into lightweight cards without leaking body content
function toSummary(post: Post): PostSummary {
  const { content, ...summary } = post;
  void content;
  return { ...summary, reading_time: readingTimeMinutes(post.content) };
}

// return normalized filters while preserving bounded pagination for direct RSC callers
function normalizeListOptions(options: PublicPostListOptions | AdminPostListOptions) {
  return {
    q: options.q?.trim().slice(0, 100) || undefined,
    category: options.category,
    page: Math.max(1, Math.floor(options.page ?? 1)),
    pageSize: Math.max(1, Math.min(20, Math.floor(options.pageSize ?? 10))),
  };
}

// escape user search text for both postgrest grammar and literal sql wildcards
function searchExpression(query: string): string {
  const likeEscaped = query.replace(/[\\%_]/g, "\\$&");
  const escaped = likeEscaped.replace(/[\\"]/g, "\\$&");
  return `title.ilike."%${escaped}%",excerpt.ilike."%${escaped}%"`;
}

// query a deterministic paginated archive with public or editor rls applied
async function queryPostList(
  client: SupabaseClient<Database>,
  options: PublicPostListOptions | AdminPostListOptions,
  publicOnly: boolean,
): Promise<PostList> {
  const filters = normalizeListOptions(options);
  let query = filters.category
    ? client.from("posts").select("*, post_categories!inner(category_id)", { count: "exact" })
    : client.from("posts").select("*", { count: "exact" });
  if (publicOnly) {
    query = query.eq("status", "published").not("published_at", "is", null).lte("published_at", new Date().toISOString());
  } else if ("status" in options && options.status) {
    query = query.eq("status", options.status);
  }
  if (filters.q) query = query.or(searchExpression(filters.q));
  if (filters.category) {
    const category = await findCategoryBySlug(client, filters.category);
    if (!category) return { items: [], total: 0, page: filters.page, pageSize: filters.pageSize };
    query = query.eq("post_categories.category_id", category.id);
  }

  query = publicOnly
    ? query.order("published_at", { ascending: false, nullsFirst: false }).order("id", { ascending: false })
    : query.order("updated_at", { ascending: false }).order("id", { ascending: false });
  const start = (filters.page - 1) * filters.pageSize;
  const { data, error, count } = await query.range(start, start + filters.pageSize - 1);
  if (error) throw unavailable();

  const records = (data ?? []) as unknown as PostRecord[];
  const categoriesByPost = await findCategoriesForPosts(client, records.map((record) => record.id));
  const items = records.map((record) => toSummary({ ...record, categories: categoriesByPost.get(record.id) ?? [] }));
  return { items, total: count ?? 0, page: filters.page, pageSize: filters.pageSize };
}

// publish a bounded archive query using only the anonymous database role
export async function listPublishedPosts(options: PublicPostListOptions = {}): Promise<PostList> {
  return queryPostList(publicClient(), options, true);
}

// resolve public post details without allowing draft or scheduled content through
export async function getPublishedPost(slug: string): Promise<Post | null> {
  const client = publicClient();
  const record = await findPostBySlug(client, slug);
  if (!record || record.status !== "published" || !record.published_at || Date.parse(record.published_at) > Date.now()) return null;
  return withCategories(client, record);
}

// list only categories whose rows are visible under anonymous row level security
export async function listPublicCategories(): Promise<Category[]> {
  return findCategories(publicClient());
}

// return editor-visible detail using verified identity and row level security
export async function getAdminPost(id: string): Promise<Post | null> {
  const { client } = await authenticateBlogEditor();
  const record = await findPostById(client, id);
  return record ? withCategories(client, record) : null;
}

// browse draft and published editor records with stable filters and pagination
export async function listAdminPosts(options: AdminPostListOptions = {}): Promise<PostList> {
  const { client } = await authenticateBlogEditor();
  return queryPostList(client, options, false);
}

// list every category only after independently verifying an editor role
export async function listAdminCategories(): Promise<Category[]> {
  const { client } = await authenticateBlogEditor();
  return findCategories(client);
}

// persist a new editor post with its category links in one database transaction
export async function createAdminPost(input: SavePostInput): Promise<Post> {
  const { client } = await authenticateBlogEditor();
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Post data is invalid", validationFields(parsed.error));
  const id = await savePost(client, parsed.data, null);
  const record = await findPostById(client, id);
  if (!record) throw unavailable();
  return withCategories(client, record);
}

// merge a partial editor patch before validating and atomically replacing category links
export async function patchAdminPost(id: string, changes: PatchPostInput): Promise<Post> {
  const { client } = await authenticateBlogEditor();
  const current = await findPostById(client, id);
  if (!current) throw new HttpError(404, "NOT_FOUND", "Post not found");
  const currentCategories = await findCategoriesForPosts(client, [id]);
  const categories = currentCategories.get(id) ?? [];
  const merged = {
    title: changes.title ?? current.title,
    slug: changes.slug ?? current.slug,
    excerpt: changes.excerpt ?? current.excerpt,
    content: changes.content ?? current.content,
    status: changes.status ?? current.status,
    category_ids: changes.category_ids ?? categories.map((category) => category.id),
    cover_path: changes.cover_path === undefined ? current.cover_path : changes.cover_path,
    cover_alt: changes.cover_alt ?? current.cover_alt ?? "",
  };
  const parsed = createPostSchema.safeParse(merged);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Post data is invalid", validationFields(parsed.error));
  const savedId = await savePost(client, parsed.data, id);
  const record = await findPostById(client, savedId);
  if (!record) throw unavailable();
  return withCategories(client, record);
}

// delete one editor-owned post after capturing its prior slug for cache invalidation
export async function deleteAdminPost(id: string): Promise<{ id: string; slug: string }> {
  const { client } = await authenticateBlogEditor();
  const record = await findPostById(client, id);
  if (!record) throw new HttpError(404, "NOT_FOUND", "Post not found");
  await removePost(client, id);
  return { id: record.id, slug: record.slug };
}

// ensure the shared extraction contract is available to server-rendered blog pages
export { extractDocumentText };
