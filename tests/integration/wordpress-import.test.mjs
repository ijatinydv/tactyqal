import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { importPrepared, parseArgs, prepareImport } from "../../scripts/wordpress/import.mjs";

const fixturePath = new URL("../fixtures/wordpress/sample-export.json", import.meta.url);

// provide the repeatable synthetic source fixture to focused conversion checks
async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}

// prove the default invocation cannot enter the write path accidentally
test("WordPress CLI defaults to a fixture dry run", () => {
  assert.deepEqual(parseArgs([]), { file: "tests/fixtures/wordpress/sample-export.json", apply: false });
  assert.deepEqual(parseArgs(["--file", "local.json", "--apply"]), { file: "local.json", apply: true });
  assert.throws(() => parseArgs(["--url", "https://example.test"]), /Usage:/);
});

// verify imported markup is restricted to supported nodes and safe marks
test("WordPress REST-shaped fixture becomes constrained rich content", async () => {
  const input = await loadFixture();
  const result = prepareImport(input);
  assert.equal(result.prepared.length, 1);
  assert.equal(result.malformedCount, 1);
  assert.equal(result.errors.length, 1);
  const [post] = result.prepared;
  assert.equal(post.slug, "synthetic-woodworking-journal");
  assert.equal(post.imported_author, "Morgan Example");
  assert.equal(post.imported_published_at, "2021-04-17T18:30:00.000Z");
  assert.equal(post.source_url, "https://wordpress.example.test/2021/04/synthetic-woodworking-journal/");
  const serialized = JSON.stringify(post.content);
  assert.match(serialized, /Safe sample guide/);
  assert.doesNotMatch(serialized, /window\.fixtureExecuted|hidden frame text|onerror|onclick|javascript:/);
  assert.match(serialized, /https:\/\/example\.test\/guide/);
  assert.deepEqual(post.categories, [{ name: "Workshop Notes", slug: "workshop-notes" }]);
});

// ensure malformed records produce bounded safe diagnostics instead of aborting a batch
test("malformed WordPress diagnostics are bounded", async () => {
  const input = await loadFixture();
  input.posts = Array.from({ length: 25 }, (_, index) => ({ id: `bad-${index}` }));
  const result = prepareImport(input);
  assert.equal(result.malformedCount, 25);
  assert.equal(result.errors.length, 10);
  assert.equal(result.prepared.length, 0);
});

// verify local persistence idempotency, provenance, collision safety, and atomic category mapping
test("local WordPress import is idempotent and preserves only drafts", { skip: process.env.WORDPRESS_IMPORT_INTEGRATION !== "1" }, async () => {
  const { localAdmin } = await import("../../scripts/local-auth.mjs");
  const admin = localAdmin();
  const fixture = await loadFixture();
  const suffix = randomUUID().replaceAll("-", "");
  const sourceUrl = `https://wordpress-${suffix}.example.test`;
  const provider = `wordpress:${sourceUrl}`;
  fixture.sourceUrl = sourceUrl;
  const sourcePost = fixture.posts[0];
  sourcePost.slug = `wordpress-sample-${suffix}`;
  sourcePost.link = `${sourceUrl}/2021/04/${sourcePost.slug}/`;
  sourcePost._embedded["wp:term"][0][0].name = `Workshop ${suffix}`;
  sourcePost._embedded["wp:term"][0][0].slug = `workshop-${suffix}`;
  fixture.posts = [sourcePost];
  const prepared = prepareImport(fixture).prepared;
  const collisionSlug = `manual-conflict-${suffix}`;
  const categorySlug = `collision-category-${suffix}`;
  const manual = await admin.from("posts").insert({
    title: "Manual collision fixture",
    slug: collisionSlug,
    excerpt: "A synthetic manual record for collision handling.",
    content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Manual record remains unchanged." }] }] },
    status: "draft",
  }).select("id").single();
  assert.ifError(manual.error);
  const conflicted = { ...prepared[0], source_id: `${sourcePost.id}-collision`, slug: collisionSlug, categories: [{ name: "Conflict category", slug: categorySlug }] };
  try {
    const first = await importPrepared(admin, prepared);
    const second = await importPrepared(admin, prepared);
    const collision = await importPrepared(admin, [conflicted]);
    assert.deepEqual(first.map((result) => result.outcome), ["inserted"]);
    assert.deepEqual(second.map((result) => result.outcome), ["skipped"]);
    assert.deepEqual(collision.map((result) => result.outcome), ["slug_conflict"]);
    const broken = { ...prepared[0], source_id: `${sourcePost.id}-rollback`, slug: `rollback-${suffix}`, categories: [{ name: "Invalid category", slug: "invalid category with spaces" }] };
    await assert.rejects(importPrepared(admin, [broken]), /import RPC failed/);
    const rolledBack = await admin.from("posts").select("id").eq("slug", broken.slug);
    assert.ifError(rolledBack.error);
    assert.deepEqual(rolledBack.data, [], "a category failure rolls back its post insert");
    const repeated = await admin.from("posts").update({ title: "An editor changed this imported draft" }).eq("imported_source_provider", provider).eq("imported_source_id", String(sourcePost.id));
    assert.ifError(repeated.error);
    await importPrepared(admin, prepared);
    const rowResult = await admin.from("posts").select("*").eq("imported_source_provider", provider).eq("imported_source_id", sourcePost.id).single();
    assert.ifError(rowResult.error);
    assert.equal(rowResult.data.status, "draft");
    assert.equal(rowResult.data.title, "An editor changed this imported draft");
    assert.equal(rowResult.data.published_at, null);
    assert.equal(rowResult.data.slug, sourcePost.slug);
    assert.equal(rowResult.data.imported_source_url, sourcePost.link);
    assert.equal(rowResult.data.imported_published_at, "2021-04-17T18:30:00+00:00");
    assert.equal(rowResult.data.imported_author, "Morgan Example");
    assert.equal(rowResult.data.author_id, null);
    assert.doesNotMatch(JSON.stringify(rowResult.data.content), /window\.fixtureExecuted|hidden frame text|javascript:/);
    const links = await admin.from("post_categories").select("categories(name,slug)").eq("post_id", rowResult.data.id);
    assert.ifError(links.error);
    assert.deepEqual(links.data.map((link) => link.categories.slug), [`workshop-${suffix}`]);
    const uncreatedCategory = await admin.from("categories").select("id").eq("slug", categorySlug);
    assert.ifError(uncreatedCategory.error);
    assert.deepEqual(uncreatedCategory.data, []);
  } finally {
    await admin.from("posts").delete().eq("imported_source_provider", provider);
    await admin.from("posts").delete().eq("id", manual.data.id);
    await admin.from("categories").delete().in("slug", [`workshop-${suffix}`, categorySlug]);
  }
});
