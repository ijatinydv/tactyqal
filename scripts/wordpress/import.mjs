import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { localAdmin } from "../local-auth.mjs";

// reuse the installed inert html parser only in this operational import tool
const require = createRequire(import.meta.url);
// avoid executing or loading untrusted source markup during conversion
const { JSDOM } = require("jsdom");
// bound the total local input before parsing source records
const MAX_FILE_BYTES = 2 * 1024 * 1024;
// prevent one demonstration import from becoming an unbounded migration job
const MAX_POSTS = 500;
// retain useful diagnostics without dumping entire malformed source records
const MAX_REPORTED_ERRORS = 10;
// limit the source markup processed for each imported record
const MAX_CONTENT_BYTES = 512 * 1024;

// keep source html parsing inert and independent from the runtime blog bundle
function createDocument(html) {
  const dom = new JSDOM("");
  const template = dom.window.document.createElement("template");
  template.innerHTML = html;
  return { document: dom.window.document, fragment: template.content, close: () => dom.window.close() };
}

// keep rich text within the blog editor vocabulary and discard executable markup
function convertHtmlToDocument(html) {
  const { fragment, close } = createDocument(html);
  let count = 0;
  let textLength = 0;

  // ensure every generated node stays within the editor's shared document bounds
  function addNode(node) {
    count += 1;
    if (count > 150) throw new Error("content has too many nodes");
    return node;
  }

  // preserve only supported inline formatting and validated web links
  function inlineNodes(parent, inheritedMarks = [], depth = 0) {
    if (depth > 8) throw new Error("content is nested too deeply");
    const result = [];
    for (const child of parent.childNodes) {
      if (child.nodeType === 3) {
        const text = child.nodeValue?.replace(/[\t\r\n ]+/g, " ") ?? "";
        if (!text) continue;
        if (text.length > 20000) throw new Error("text node exceeds the editor limit");
        textLength += text.length;
        if (textLength > 50_000) throw new Error("content has too much text");
        const node = addNode({ type: "text", text });
        if (inheritedMarks.length) node.marks = inheritedMarks.slice(0, 2);
        result.push(node);
        continue;
      }
      if (child.nodeType !== 1) continue;
      const tag = child.tagName.toLowerCase();
      if (["script", "style", "iframe", "object", "embed", "svg", "math", "template", "noscript"].includes(tag)) continue;
      let marks = inheritedMarks;
      if (["strong", "b", "em", "i", "a"].includes(tag)) {
        const mark = tag === "strong" || tag === "b"
          ? { type: "bold" }
          : tag === "em" || tag === "i"
            ? { type: "italic" }
            : safeLinkMark(child.getAttribute("href"));
        if (mark) marks = [...inheritedMarks, mark];
      }
      result.push(...inlineNodes(child, marks, depth + 1));
    }
    return result;
  }

  // convert blocks and unwrap harmless containers without retaining their attributes
  function blocks(parent, depth = 0) {
    if (depth > 8) throw new Error("content is nested too deeply");
    const result = [];
    let inlineBuffer = [];
    // avoid emitting empty paragraphs while keeping adjacent inline text together
    const flushInline = () => {
      const content = inlineBuffer;
      inlineBuffer = [];
      if (content.length) result.push(addNode({ type: "paragraph", content }));
    };
    for (const child of parent.childNodes) {
      if (child.nodeType === 3) {
        if (child.nodeValue?.trim()) inlineBuffer.push(...inlineNodes(child));
        continue;
      }
      if (child.nodeType !== 1) continue;
      const tag = child.tagName.toLowerCase();
      if (["script", "style", "iframe", "object", "embed", "svg", "math", "template", "noscript"].includes(tag)) continue;
      if (["p", "h1", "h2", "h3"].includes(tag)) {
        flushInline();
        const content = inlineNodes(child, [], depth + 1);
        if (!content.length) continue;
        result.push(addNode(tag === "p"
          ? { type: "paragraph", content }
          : { type: "heading", attrs: { level: tag === "h3" ? 3 : 2 }, content }));
        continue;
      }
      if (tag === "ul" || tag === "ol") {
        flushInline();
        const items = [...child.children].filter((element) => element.tagName.toLowerCase() === "li").map((item) => {
          const itemBlocks = blocks(item, depth + 1);
          return addNode({ type: "listItem", content: itemBlocks.length ? itemBlocks : [addNode({ type: "paragraph", content: [] })] });
        });
        if (items.length) result.push(addNode({ type: tag === "ul" ? "bulletList" : "orderedList", content: items }));
        continue;
      }
      if (["br", "hr", "img", "source", "track"].includes(tag)) {
        if (tag === "br") inlineBuffer.push(addNode({ type: "text", text: " " }));
        continue;
      }
      if (["strong", "b", "em", "i", "a", "span"].includes(tag)) {
        inlineBuffer.push(...inlineNodes(child, [], depth + 1));
        continue;
      }
      flushInline();
      result.push(...blocks(child, depth + 1));
    }
    flushInline();
    return result;
  }

  // accept only absolute http and https anchors and never retain other attributes
  function safeLinkMark(href) {
    if (!href || href.length > 2048) return null;
    try {
      const url = new URL(href);
      return ["http:", "https:"].includes(url.protocol) ? { type: "link", attrs: { href: url.href } } : null;
    } catch {
      return null;
    }
  }

  try {
    const content = blocks(fragment);
    // prevent imported arrays from exceeding the same node collection bounds as the editor
    function validateCollections(nodes) {
      if (nodes.length > 50) throw new Error("content collection exceeds the editor limit");
      for (const node of nodes) if (Array.isArray(node.content)) validateCollections(node.content);
    }
    validateCollections(content);
    const serialized = JSON.stringify({ type: "doc", content });
    if (Buffer.byteLength(serialized) > 131_072) throw new Error("converted content exceeds 128 KiB");
    return { type: "doc", content };
  } finally {
    close();
  }
}

// extract readable text from source excerpts without carrying markup into post fields
function plainText(html) {
  const safeHtml = typeof html === "string" ? html.slice(0, MAX_CONTENT_BYTES) : "";
  const { document, fragment, close } = createDocument(safeHtml);
  try {
    const blocked = fragment.querySelectorAll("script,style,iframe,object,embed,svg,math,template,noscript");
    for (const element of blocked) element.remove();
    return (fragment.textContent ?? "").replace(/\s+/g, " ").trim();
  } finally {
    close();
    void document;
  }
}

// normalize WordPress category labels into bounded database-safe slugs
function slugify(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100).replace(/-+$/g, "");
}

// read terms from embedded REST responses or explicit synthetic fixture records
function categoryTerms(post) {
  if (Array.isArray(post.categories) && post.categories.every((item) => item && typeof item === "object")) return post.categories;
  const terms = post._embedded?.["wp:term"];
  return Array.isArray(terms) ? terms.flat().filter((term) => term && typeof term === "object" && (!term.taxonomy || term.taxonomy === "category")) : [];
}

// validate and map one REST-shaped record to an unpublished local editorial record
function prepareRecord(post, sourceUrl) {
  if (!post || typeof post !== "object" || Array.isArray(post)) throw new Error("record must be an object");
  if (!["publish", "draft", "pending", "private", "future"].includes(post.status)) throw new Error("record status is not importable");
  if (typeof post.id === "number" && !Number.isSafeInteger(post.id)) throw new Error("record numeric id is not safely representable");
  const sourceId = String(post.id ?? "");
  if (!/^\d{1,20}$/.test(sourceId)) throw new Error("record id must be a positive numeric WordPress id");
  const slug = post.slug;
  if (typeof slug !== "string" || slug.length > 180 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("record slug is not supported");
  const title = plainText(post.title?.rendered).slice(0, 160).trim();
  if (!title) throw new Error("record title is empty");
  const rawContent = post.content?.rendered;
  if (typeof rawContent !== "string" || Buffer.byteLength(rawContent) > MAX_CONTENT_BYTES) throw new Error("record content is missing or too large");
  const content = convertHtmlToDocument(rawContent);
  const excerptText = plainText(post.excerpt?.rendered || "") || content.content
    .map((node) => (node.content ?? []).map((text) => text.text ?? "").join(" ")).join(" ").replace(/\s+/g, " ").trim();
  const excerpt = excerptText.slice(0, 320).trim();
  if (!excerpt) throw new Error("record excerpt and body are empty");
  const hasGmtDate = typeof post.date_gmt === "string" && post.date_gmt !== "0000-00-00 00:00:00";
  const sourceDate = hasGmtDate ? post.date_gmt : post.date;
  const dateWithZone = typeof sourceDate === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(sourceDate)
    ? `${sourceDate.replace(" ", "T")}Z`
    : sourceDate;
  const publishedAt = typeof dateWithZone === "string" ? new Date(dateWithZone) : null;
  if (!publishedAt || Number.isNaN(publishedAt.valueOf())) throw new Error("record publication date is invalid");
  const embeddedAuthor = post._embedded?.author?.[0]?.name;
  const importedAuthor = String(embeddedAuthor ?? post.author_name ?? "Unknown author").replace(/\s+/g, " ").trim().slice(0, 160) || "Unknown author";
  const categories = categoryTerms(post).map((term) => {
    const name = typeof term.name === "string" ? term.name.replace(/\s+/g, " ").trim().slice(0, 80) : "";
    const categorySlug = typeof term.slug === "string" ? slugify(term.slug) : slugify(name);
    if (!name || !categorySlug) throw new Error("record contains an invalid category");
    return { name, slug: categorySlug };
  });
  const uniqueCategories = [...new Map(categories.map((category) => [category.slug, category])).values()];
  if (uniqueCategories.length > 10) throw new Error("record has more than 10 categories");
  const sourceRecordUrl = typeof post.link === "string" ? post.link : `${sourceUrl.replace(/\/$/, "")}/?p=${sourceId}`;
  let parsedSourceRecordUrl;
  try { parsedSourceRecordUrl = new URL(sourceRecordUrl); } catch { throw new Error("record source URL is invalid"); }
  if (!["http:", "https:"].includes(parsedSourceRecordUrl.protocol) || sourceRecordUrl.length > 2048) throw new Error("record source URL is invalid");
  return {
    source_provider: `wordpress:${sourceUrl}`,
    source_id: sourceId,
    source_url: sourceRecordUrl,
    title,
    slug,
    excerpt,
    content,
    imported_published_at: publishedAt.toISOString(),
    imported_author: importedAuthor,
    categories: uniqueCategories,
  };
}

// prepare bounded input while retaining only a small sample of malformed-record details
export function prepareImport(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Import file must contain a JSON object.");
  if (typeof input.sourceUrl !== "string" || input.sourceUrl.length > 2048) throw new Error("Import file requires a bounded sourceUrl.");
  let sourceUrl;
  try { sourceUrl = new URL(input.sourceUrl).href.replace(/\/$/, ""); } catch { throw new Error("sourceUrl must be an http or https URL."); }
  if (!["http:", "https:"].includes(new URL(sourceUrl).protocol)) throw new Error("sourceUrl must be an http or https URL.");
  if (!Array.isArray(input.posts) || input.posts.length > MAX_POSTS) throw new Error(`Import file must contain at most ${MAX_POSTS} posts.`);
  const prepared = [];
  const errors = [];
  input.posts.forEach((post, index) => {
    try {
      prepared.push(prepareRecord(post, sourceUrl));
    } catch (error) {
      if (errors.length < MAX_REPORTED_ERRORS) errors.push({ index, id: String(post?.id ?? "").slice(0, 40), reason: String(error.message).slice(0, 160) });
    }
  });
  return { sourceUrl, prepared, malformedCount: input.posts.length - prepared.length, errors };
}

// persist each prepared post and its categories through one local atomic database operation
export async function importPrepared(admin, prepared) {
  const results = [];
  for (const post of prepared) {
    const { categories, ...record } = post;
    const { data, error } = await admin.rpc("wordpress_import_post", { p_post: record, p_categories: categories });
    if (error) throw new Error(`Local import RPC failed for source record ${post.source_id}: ${error.message}`);
    results.push({ sourceId: post.source_id, outcome: data });
  }
  return results;
}

// parse cli flags without accepting remote input or implicit write mode
export function parseArgs(args) {
  let file = "tests/fixtures/wordpress/sample-export.json";
  let apply = false;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--apply") apply = true;
    else if (args[index] === "--file" && args[index + 1]) file = args[++index];
    else throw new Error("Usage: node scripts/import-wordpress.mjs [--file local.json] [--apply]");
  }
  return { file, apply };
}

// run a local-only dry run unless the operator explicitly requests persistence
export async function runCli(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const fileStat = await stat(options.file);
  if (!fileStat.isFile() || fileStat.size > MAX_FILE_BYTES) throw new Error("Import file must be a regular file no larger than 2 MiB.");
  const bytes = await readFile(options.file);
  if (bytes.byteLength > MAX_FILE_BYTES) throw new Error("Import file exceeds the 2 MiB limit.");
  const parsed = prepareImport(JSON.parse(bytes.toString("utf8")));
  const results = options.apply ? await importPrepared(localAdmin(), parsed.prepared) : parsed.prepared.map((post) => ({ sourceId: post.source_id, outcome: "dry_run" }));
  console.log(JSON.stringify({ mode: options.apply ? "apply" : "dry_run", sourceUrl: parsed.sourceUrl, accepted: parsed.prepared.length, malformed: parsed.malformedCount, reportedErrors: parsed.errors, results }, null, 2));
}

// make command line failures visible without exposing source content or credentials
async function main() {
  try {
    await runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "WordPress import failed.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
