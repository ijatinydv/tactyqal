import { JSDOM } from "jsdom";
import * as he from "he";
import type { RichDocument } from "./types";

export type WordPressRawPost = Record<string, unknown>;

// decode HTML entities and collapse redundant whitespace
export function cleanHtmlEntities(text: string): string {
  if (!text) return "";
  const decodeFn = typeof he.decode === "function"
    ? he.decode
    : ((he as unknown as { default?: { decode?: (s: string) => string } }).default?.decode);
  const decoded = typeof decodeFn === "function" ? decodeFn(text) : text;
  return decoded.replace(/[\t\r\n ]+/g, " ").trim();
}

// strip all HTML tags and decode entities to obtain pure text
export function stripHtml(html: string): string {
  if (!html) return "";
  // strip WordPress shortcodes first: [caption ...]...[/caption], [embed]...[/embed]
  const withoutShortcodes = html.replace(/\[\/?(?:caption|embed|gallery|audio|video)[^\]]*\]/gi, "");
  // strip all HTML tags
  const withoutTags = withoutShortcodes.replace(/<[^>]*>/g, " ");
  return cleanHtmlEntities(withoutTags);
}

// convert terms or titles into URL-safe slugs
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
}

// validate safe http/https link targets
function safeLinkMark(href: string | null | undefined): { type: "link"; attrs: { href: string } } | null {
  if (!href || href.length > 2048) return null;
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? { type: "link", attrs: { href: url.href } } : null;
  } catch {
    return null;
  }
}

// convert WordPress HTML markup into the application's RichDocument format
export function htmlToRichDocument(html: string): RichDocument {
  if (!html || typeof html !== "string") {
    return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "No content available." }] }] };
  }

  // strip WordPress shortcodes before DOM parsing
  const cleanHtml = html.replace(/\[\/?(?:caption|embed|gallery|audio|video)[^\]]*\]/gi, "");
  const dom = new JSDOM("");
  const template = dom.window.document.createElement("template");
  template.innerHTML = cleanHtml;
  const fragment = template.content;

  type InlineNode = {
    type: "text";
    text: string;
    marks?: Array<{ type: "bold" | "italic" } | { type: "link"; attrs: { href: string } }>;
  };

  type BlockNode =
    | { type: "paragraph"; content: InlineNode[] }
    | { type: "heading"; attrs: { level: 2 | 3 }; content: InlineNode[] }
    | { type: "bulletList"; content: Array<{ type: "listItem"; content: BlockNode[] }> }
    | { type: "orderedList"; content: Array<{ type: "listItem"; content: BlockNode[] }> }
    | { type: "listItem"; content: BlockNode[] };

  function inlineNodes(
    parent: Node,
    inheritedMarks: Array<{ type: "bold" | "italic" } | { type: "link"; attrs: { href: string } }> = [],
    depth = 0,
  ): InlineNode[] {
    if (depth > 12) return [];
    const result: InlineNode[] = [];

    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === 3) { // Text node
        const rawText = child.nodeValue ?? "";
        const text = cleanHtmlEntities(rawText);
        if (!text) continue;
        const boundedText = text.slice(0, 20000);
        const node: InlineNode = { type: "text", text: boundedText };
        if (inheritedMarks.length > 0) {
          node.marks = inheritedMarks.slice(0, 2);
        }
        result.push(node);
        continue;
      }

      if (child.nodeType !== 1) continue; // Skip non-elements
      const element = child as Element;
      const tag = element.tagName.toLowerCase();

      // Discard dangerous or unwanted elements
      if (["script", "style", "iframe", "object", "embed", "svg", "math", "template", "noscript", "form", "input", "button"].includes(tag)) {
        continue;
      }

      let marks = inheritedMarks;
      if (["strong", "b", "em", "i", "a"].includes(tag)) {
        const newMark = tag === "strong" || tag === "b"
          ? { type: "bold" as const }
          : tag === "em" || tag === "i"
            ? { type: "italic" as const }
            : safeLinkMark(element.getAttribute("href"));
        if (newMark && !marks.some((m) => m.type === newMark.type)) {
          marks = [...marks, newMark];
        }
      }

      result.push(...inlineNodes(element, marks, depth + 1));
    }

    return result;
  }

  function blocks(parent: Node, depth = 0): BlockNode[] {
    if (depth > 12) return [];
    const result: BlockNode[] = [];
    let inlineBuffer: InlineNode[] = [];

    const flushInline = () => {
      if (inlineBuffer.length > 0) {
        result.push({ type: "paragraph", content: inlineBuffer });
        inlineBuffer = [];
      }
    };

    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === 3) {
        const text = cleanHtmlEntities(child.nodeValue ?? "");
        if (text) inlineBuffer.push(...inlineNodes(child));
        continue;
      }

      if (child.nodeType !== 1) continue;
      const element = child as Element;
      const tag = element.tagName.toLowerCase();

      if (["script", "style", "iframe", "object", "embed", "svg", "math", "template", "noscript", "form", "input", "button"].includes(tag)) {
        continue;
      }

      if (["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        flushInline();
        const content = inlineNodes(element, [], depth + 1);
        if (!content.length) continue;
        if (tag === "p") {
          result.push({ type: "paragraph", content });
        } else if (tag === "h1" || tag === "h2") {
          result.push({ type: "heading", attrs: { level: 2 }, content });
        } else {
          result.push({ type: "heading", attrs: { level: 3 }, content });
        }
        continue;
      }

      if (tag === "ul" || tag === "ol") {
        flushInline();
        const items: Array<{ type: "listItem"; content: BlockNode[] }> = [];
        for (const li of Array.from(element.children)) {
          if (li.tagName.toLowerCase() !== "li") continue;
          const liBlocks = blocks(li, depth + 1);
          if (liBlocks.length > 0) {
            items.push({ type: "listItem", content: liBlocks });
          } else {
            const liInlines = inlineNodes(li, [], depth + 1);
            items.push({
              type: "listItem",
              content: [{ type: "paragraph", content: liInlines.length > 0 ? liInlines : [{ type: "text", text: "" }] }],
            });
          }
        }
        if (items.length > 0) {
          result.push({ type: tag === "ul" ? "bulletList" : "orderedList", content: items });
        }
        continue;
      }

      if (tag === "blockquote") {
        flushInline();
        const bqBlocks = blocks(element, depth + 1);
        if (bqBlocks.length > 0) {
          result.push(...bqBlocks);
        } else {
          const inlines = inlineNodes(element, [{ type: "italic" }], depth + 1);
          if (inlines.length > 0) {
            result.push({ type: "paragraph", content: inlines });
          }
        }
        continue;
      }

      if (["br", "hr"].includes(tag)) {
        flushInline();
        continue;
      }

      if (["strong", "b", "em", "i", "a", "span"].includes(tag)) {
        inlineBuffer.push(...inlineNodes(element, [], depth + 1));
        continue;
      }

      // Default container tags (div, section, article, table, etc.): recurse child blocks
      flushInline();
      result.push(...blocks(element, depth + 1));
    }

    flushInline();
    return result;
  }

  try {
    const rawBlocks = blocks(fragment);
    // Ensure document is not empty
    const finalBlocks = rawBlocks.length > 0
      ? rawBlocks
      : [{ type: "paragraph" as const, content: [{ type: "text" as const, text: cleanHtmlEntities(fragment.textContent ?? "") || "No content." }] }];

    const doc: RichDocument = { type: "doc", content: finalBlocks };

    // Bound total serialized size within Postgres octet limit (262,144 bytes)
    let serialized = JSON.stringify(doc);
    while (Buffer.byteLength(serialized, "utf8") > 240_000 && doc.content.length > 1) {
      doc.content.pop();
      serialized = JSON.stringify(doc);
    }

    return doc;
  } finally {
    dom.window.close();
  }
}

// extract categories from WordPress _embedded or categories array
export function extractCategories(post: WordPressRawPost): Array<{ name: string; slug: string }> {
  const terms: Array<Record<string, unknown>> = [];
  const embedded = post._embedded as Record<string, unknown> | undefined;
  const wpTerm = embedded?.["wp:term"];
  if (Array.isArray(wpTerm)) {
    for (const group of wpTerm) {
      if (Array.isArray(group)) {
        for (const term of group) {
          if (term && typeof term === "object" && (term.taxonomy === "category" || !term.taxonomy)) {
            terms.push(term as Record<string, unknown>);
          }
        }
      }
    }
  }

  const categoryMap = new Map<string, { name: string; slug: string }>();
  for (const term of terms) {
    const rawName = typeof term.name === "string" ? term.name : "";
    const name = cleanHtmlEntities(rawName).slice(0, 80);
    const rawSlug = typeof term.slug === "string" && term.slug.trim() ? term.slug : slugify(name);
    const slug = slugify(rawSlug);
    if (name && slug && !categoryMap.has(slug)) {
      categoryMap.set(slug, { name, slug });
    }
  }

  return Array.from(categoryMap.values()).slice(0, 10);
}

// extract featured image source_url from _embedded
export function extractCoverUrl(post: WordPressRawPost): string | null {
  const embedded = post._embedded as Record<string, unknown> | undefined;
  const media = embedded?.["wp:featuredmedia"];
  if (Array.isArray(media) && media.length > 0) {
    const firstMedia = media[0] as Record<string, unknown> | undefined;
    const sourceUrl = firstMedia?.source_url;
    if (typeof sourceUrl === "string" && sourceUrl.startsWith("http") && sourceUrl.length <= 512) {
      return sourceUrl;
    }
  }
  return null;
}

export type MappedWordPressPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: RichDocument;
  status: "published";
  published_at: string;
  cover_path: string | null;
  cover_alt: string;
  imported_source_provider: string;
  imported_source_id: string;
  imported_source_url: string;
  imported_published_at: string;
  imported_author: string;
  categories: Array<{ name: string; slug: string }>;
};

// map a raw WordPress post record into our validated application contract
export function mapWordPressPost(post: WordPressRawPost, sourceBaseUrl = "https://www.tactyqal.com/blog"): MappedWordPressPost {
  if (!post || typeof post !== "object") throw new Error("WordPress post must be an object");

  const rawId = String(post.id ?? "");
  if (!/^\d+$/.test(rawId)) throw new Error(`Invalid WordPress post id: ${rawId}`);

  // 1. Slug: preserve from WP or fallback to slugified title
  let slug = typeof post.slug === "string" && post.slug.trim() ? slugify(post.slug) : "";
  if (!slug) {
    const titleObj = post.title as Record<string, unknown> | undefined;
    slug = slugify(typeof titleObj?.rendered === "string" ? titleObj.rendered : `post-${rawId}`);
  }
  slug = slug.slice(0, 180);

  // 2. Title: clean entities, max 160 chars
  const titleObj = post.title as Record<string, unknown> | undefined;
  const title = cleanHtmlEntities(typeof titleObj?.rendered === "string" ? titleObj.rendered : "").slice(0, 160) || `Post ${rawId}`;

  // 3. Content: convert HTML to RichDocument
  const contentObj = post.content as Record<string, unknown> | undefined;
  const rawHtml = typeof contentObj?.rendered === "string" ? contentObj.rendered : "";
  const content = htmlToRichDocument(rawHtml);

  // 4. Excerpt: clean entities, strip tags, fallback to content
  const excerptObj = post.excerpt as Record<string, unknown> | undefined;
  let excerpt = stripHtml(typeof excerptObj?.rendered === "string" ? excerptObj.rendered : "");
  if (!excerpt) {
    // fallback to first 160 chars of plain text content
    const firstText = content.content
      .map((block) => {
        if ("content" in block && Array.isArray(block.content)) {
          return block.content.map((inline) => ("text" in inline && typeof inline.text === "string" ? inline.text : "")).join(" ");
        }
        return "";
      })
      .join(" ");
    excerpt = cleanHtmlEntities(firstText);
  }
  excerpt = excerpt.slice(0, 320).trim() || title;

  // 5. Published date: date_gmt or date, clamped to now()
  const rawDateGmt = typeof post.date_gmt === "string" && post.date_gmt !== "0000-00-00 00:00:00" ? post.date_gmt : null;
  const rawDate = rawDateGmt || (typeof post.date === "string" ? post.date : null);
  const isoCandidate = typeof rawDate === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(rawDate)
    ? `${rawDate.replace(" ", "T")}Z`
    : rawDate;

  let publishedAtDate = isoCandidate ? new Date(isoCandidate) : new Date();
  if (Number.isNaN(publishedAtDate.getTime()) || publishedAtDate.getTime() > Date.now()) {
    publishedAtDate = new Date();
  }
  const publishedAtIso = publishedAtDate.toISOString();

  // 6. Cover image
  const coverUrl = extractCoverUrl(post);
  const embedded = post._embedded as Record<string, unknown> | undefined;
  const featuredMedia = embedded?.["wp:featuredmedia"] as Array<Record<string, unknown>> | undefined;
  const coverAlt = cleanHtmlEntities(typeof featuredMedia?.[0]?.alt_text === "string" ? featuredMedia[0].alt_text : "").slice(0, 200);

  // 7. Author
  const authors = embedded?.author as Array<Record<string, unknown>> | undefined;
  const authorName = cleanHtmlEntities(
    typeof authors?.[0]?.name === "string"
      ? authors[0].name
      : typeof post.author_name === "string"
        ? post.author_name
        : "Tactyqal Team",
  ).slice(0, 160) || "Tactyqal Team";

  // 8. Categories
  const categories = extractCategories(post);

  // 9. Source metadata
  const sourceUrl = typeof post.link === "string" ? post.link.slice(0, 2048) : `${sourceBaseUrl.replace(/\/$/, "")}/?p=${rawId}`;

  return {
    title,
    slug,
    excerpt,
    content,
    status: "published",
    published_at: publishedAtIso,
    cover_path: coverUrl,
    cover_alt: coverAlt,
    imported_source_provider: `wordpress:${sourceBaseUrl.replace(/\/$/, "")}`,
    imported_source_id: rawId,
    imported_source_url: sourceUrl,
    imported_published_at: publishedAtIso,
    imported_author: authorName,
    categories,
  };
}
