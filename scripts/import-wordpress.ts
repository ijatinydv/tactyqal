#!/usr/bin/env tsx
/**
 * scripts/import-wordpress.ts
 *
 * Idempotent migration script that imports published posts from the company's
 * WordPress REST API into the Supabase database.
 *
 * Run:
 *   pnpm import:wp
 *   pnpm import:wp --limit 10   (import first 10 posts for testing)
 *   pnpm import:wp --dry-run    (fetch & map without writing to database)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mapWordPressPost, type MappedWordPressPost } from "../src/features/blog/wordpress-mapper";

// ── Environment Resolution ──────────────────────────────────────────────────

function loadEnvFile(): Record<string, string> {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const fileEnv = loadEnvFile();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

const PRIMARY_API = "https://www.tactyqal.com/blog/wp-json/wp/v2/posts";
const FALLBACK_API = "https://www.tactyqal.com/blog/?rest_route=/wp/v2/posts";
const SOURCE_BASE = "https://www.tactyqal.com/blog";

// ── CLI Options ─────────────────────────────────────────────────────────────

interface CliOptions {
  limit?: number;
  dryRun?: boolean;
}

function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else if (args[i] === "--limit" && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    }
  }
  return options;
}

// ── WordPress Fetching ──────────────────────────────────────────────────────

async function fetchWordPressPage(page: number, perPage = 50): Promise<{ posts: Array<Record<string, unknown>>; totalPages: number; totalCount: number }> {
  const query = `per_page=${perPage}&page=${page}&_embed=1&status=publish`;
  const primaryUrl = `${PRIMARY_API}?${query}`;
  const fallbackUrl = `${FALLBACK_API}&${query}`;

  async function tryFetch(targetUrl: string): Promise<{ posts: Array<Record<string, unknown>>; totalPages: number; totalCount: number } | null> {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(30000),
      });

      if (response.status === 400) {
        return { posts: [], totalPages: 0, totalCount: 0 };
      }

      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("json")) return null;

      const text = await response.text();
      const posts = JSON.parse(text);
      if (!Array.isArray(posts)) return null;

      const totalPages = parseInt(response.headers.get("x-wp-totalpages") || "1", 10);
      const totalCount = parseInt(response.headers.get("x-wp-total") || "0", 10);
      return { posts, totalPages, totalCount };
    } catch {
      return null;
    }
  }

  // 1. Try Primary URL
  let result = await tryFetch(primaryUrl);
  if (result) return result;

  // 2. Try Fallback URL
  console.warn(`[WARN] Primary URL failed or returned non-JSON for page ${page}. Trying fallback...`);
  result = await tryFetch(fallbackUrl);
  if (result) return result;

  // 3. Retry fallback once after short delay
  console.warn(`[WARN] Retrying fallback URL for page ${page} in 2 seconds...`);
  await new Promise((r) => setTimeout(r, 2000));
  result = await tryFetch(fallbackUrl);
  if (result) return result;

  throw new Error(`Failed to fetch page ${page} from both Primary and Fallback WordPress URLs.`);
}

// ── Database Operations ─────────────────────────────────────────────────────

async function upsertPost(client: SupabaseClient, post: MappedWordPressPost): Promise<"inserted" | "updated"> {
  // Check if post already exists by imported source identity OR by slug
  const { data: existingById } = await client
    .from("posts")
    .select("id, slug")
    .eq("imported_source_provider", post.imported_source_provider)
    .eq("imported_source_id", post.imported_source_id)
    .maybeSingle();

  let targetId = existingById?.id;

  if (!targetId) {
    const { data: existingBySlug } = await client
      .from("posts")
      .select("id, slug")
      .eq("slug", post.slug)
      .maybeSingle();
    targetId = existingBySlug?.id;
  }

  let outcome: "inserted" | "updated" = "inserted";

  if (targetId) {
    // Update existing post
    const { error: updateError } = await client
      .from("posts")
      .update({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        cover_path: post.cover_path,
        cover_alt: post.cover_alt,
        status: post.status,
        published_at: post.published_at,
        imported_source_provider: post.imported_source_provider,
        imported_source_id: post.imported_source_id,
        imported_source_url: post.imported_source_url,
        imported_published_at: post.imported_published_at,
        imported_author: post.imported_author,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetId);

    if (updateError) throw new Error(`Update failed for post ${post.slug}: ${updateError.message}`);
    outcome = "updated";
  } else {
    // Insert new post
    const { data: inserted, error: insertError } = await client
      .from("posts")
      .insert({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        cover_path: post.cover_path,
        cover_alt: post.cover_alt,
        status: post.status,
        published_at: post.published_at,
        imported_source_provider: post.imported_source_provider,
        imported_source_id: post.imported_source_id,
        imported_source_url: post.imported_source_url,
        imported_published_at: post.imported_published_at,
        imported_author: post.imported_author,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Insert failed for post ${post.slug}: ${insertError.message}`);
    targetId = inserted.id;
  }

  // Handle categories
  if (post.categories.length > 0 && targetId) {
    for (const cat of post.categories) {
      const { data: catData, error: catError } = await client
        .from("categories")
        .upsert({ name: cat.name, slug: cat.slug }, { onConflict: "slug" })
        .select("id")
        .single();

      if (catError) {
        console.warn(`[WARN] Could not upsert category ${cat.name}: ${catError.message}`);
        continue;
      }

      if (catData?.id) {
        const { error: linkError } = await client
          .from("post_categories")
          .upsert({ post_id: targetId, category_id: catData.id }, { onConflict: "post_id,category_id" });

        if (linkError) {
          console.warn(`[WARN] Could not link category ${cat.name} to post ${post.slug}: ${linkError.message}`);
        }
      }
    }
  }

  return outcome;
}

async function upsertPostWithRetry(client: SupabaseClient, post: MappedWordPressPost, maxRetries = 3): Promise<"inserted" | "updated"> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await upsertPost(client, post);
    } catch (err: unknown) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

// ── Main Import Runner ──────────────────────────────────────────────────────

async function main() {
  const options = parseCliArgs(process.argv.slice(2));

  console.log("══════════════════════════════════════════════════════════════");
  console.log("       Tactyqal Blog — WordPress Migration Script             ");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`Target Supabase URL : ${SUPABASE_URL || "NOT SET"}`);
  console.log(`Mode                : ${options.dryRun ? "DRY RUN (no database writes)" : "APPLY (live database write)"}`);
  if (options.limit) console.log(`Post limit          : ${options.limit}`);
  console.log("──────────────────────────────────────────────────────────────");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const startTime = Date.now();
  let page = 1;
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  const failedPosts: Array<{ id: string; slug: string; reason: string }> = [];

  while (true) {
    console.log(`\n[PAGE ${page}] Fetching up to 50 posts from WordPress...`);
    let pageResult;
    try {
      pageResult = await fetchWordPressPage(page, 50);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] Failed to fetch page ${page}: ${msg}`);
      break;
    }

    const { posts, totalPages, totalCount } = pageResult;
    if (posts.length === 0) {
      console.log(`[PAGE ${page}] No more posts returned. Pagination complete.`);
      break;
    }

    console.log(`[PAGE ${page}] Received ${posts.length} posts (WP total: ${totalCount} across ${totalPages} pages).`);

    const pagePosts = options.limit ? posts.slice(0, Math.max(0, options.limit - totalProcessed)) : posts;
    let postIndex = 0;
    const concurrency = 6;
    const workers = Array.from({ length: Math.min(concurrency, pagePosts.length) }, async () => {
      while (postIndex < pagePosts.length) {
        const currentIdx = postIndex++;
        const rawPost = pagePosts[currentIdx];
        const num = totalProcessed + currentIdx + 1;

        try {
          const mapped = mapWordPressPost(rawPost, SOURCE_BASE);

          if (options.dryRun) {
            console.log(`  [DRY RUN] [${num}] "${mapped.title}" (slug: ${mapped.slug})`);
            totalInserted++;
          } else {
            const outcome = await upsertPostWithRetry(client, mapped);
            if (outcome === "inserted") {
              totalInserted++;
              console.log(`  [+] Inserted [${num}] "${mapped.title}" (/blog/${mapped.slug})`);
            } else {
              totalUpdated++;
              console.log(`  [~] Updated  [${num}] "${mapped.title}" (/blog/${mapped.slug})`);
            }
          }
        } catch (err: unknown) {
          totalFailed++;
          const postId = String(rawPost?.id ?? "unknown");
          const postSlug = String(rawPost?.slug ?? "unknown");
          const reason = err instanceof Error ? err.message : String(err);
          console.error(`  [!] Failed post #${postId} (${postSlug}): ${reason}`);
          failedPosts.push({ id: postId, slug: postSlug, reason });
        }
      }
    });

    await Promise.all(workers);
    totalProcessed += pagePosts.length;

    if (options.limit && totalProcessed >= options.limit) break;
    if (posts.length < 50 || page >= totalPages) {
      console.log(`\n[INFO] Reached last page (${page}/${totalPages}). Done fetching.`);
      break;
    }

    page++;
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("                 IMPORT SUMMARY REPORT                        ");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`Total processed : ${totalProcessed}`);
  console.log(`Newly inserted  : ${totalInserted}`);
  console.log(`Updated         : ${totalUpdated}`);
  console.log(`Failed          : ${totalFailed}`);
  console.log(`Elapsed time    : ${durationSec}s`);
  console.log("──────────────────────────────────────────────────────────────");

  if (failedPosts.length > 0) {
    console.log(`\nFailed items (${failedPosts.length}):`);
    for (const f of failedPosts.slice(0, 10)) {
      console.log(`  - WP ID ${f.id} (${f.slug}): ${f.reason}`);
    }
    if (failedPosts.length > 10) {
      console.log(`  ... and ${failedPosts.length - 10} more.`);
    }
  }

  console.log("\n[SUCCESS] Migration finished.");
}

main().catch((err) => {
  console.error("\n[FATAL] Migration script encountered an unhandled error:", err);
  process.exitCode = 1;
});
