import { describe, expect, it } from "vitest";
import {
  cleanHtmlEntities,
  extractCategories,
  extractCoverUrl,
  htmlToRichDocument,
  mapWordPressPost,
  slugify,
  stripHtml,
} from "./wordpress-mapper";

describe("WordPress Mapper", () => {
  it("decodes HTML entities and normalizes whitespace", () => {
    expect(cleanHtmlEntities("Problem Solving &amp; Decision Making")).toBe("Problem Solving & Decision Making");
    expect(cleanHtmlEntities("You&#8217;re ready &#8220;now&#8221;")).toBe("You’re ready “now”");
    expect(cleanHtmlEntities("Multiple   spaces\nand\ttabs")).toBe("Multiple spaces and tabs");
  });

  it("strips HTML tags and WordPress shortcodes from text", () => {
    const raw = "<p>This is <strong>bold</strong> text with [caption id=\"123\"]A caption[/caption] inside.</p>";
    expect(stripHtml(raw)).toBe("This is bold text with A caption inside.");
  });

  it("generates URL-safe slugs", () => {
    expect(slugify("Startup Business Ideas!")).toBe("startup-business-ideas");
    expect(slugify("  Café & Résumé 101 -- ")).toBe("cafe-resume-101");
  });

  it("converts HTML markup to structured RichDocument AST", () => {
    const html = `
      <h2>The Main Heading</h2>
      <p>A paragraph with <strong>bold</strong>, <em>italic</em>, and <a href="https://example.com/guide">a link</a>.</p>
      <ul>
        <li>First item</li>
        <li>Second item</li>
      </ul>
      <ol>
        <li>Numbered item</li>
      </ol>
      <script>alert('bad')</script>
    `;

    const doc = htmlToRichDocument(html);
    expect(doc.type).toBe("doc");
    expect(doc.content.length).toBe(4);

    // heading
    expect(doc.content[0]).toMatchObject({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "The Main Heading" }],
    });

    // paragraph
    const p = doc.content[1];
    expect(p.type).toBe("paragraph");
    if (p.type === "paragraph") {
      expect(p.content.some((n) => n.text === "bold" && n.marks?.some((m) => m.type === "bold"))).toBe(true);
      expect(p.content.some((n) => n.text === "italic" && n.marks?.some((m) => m.type === "italic"))).toBe(true);
      expect(p.content.some((n) => n.text === "a link" && n.marks?.some((m) => m.type === "link"))).toBe(true);
    }

    // bulletList
    expect(doc.content[2]).toMatchObject({
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "First item" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Second item" }] }] },
      ],
    });

    // orderedList
    expect(doc.content[3]).toMatchObject({
      type: "orderedList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Numbered item" }] }] },
      ],
    });

    // no script tag in serialized document
    const serialized = JSON.stringify(doc);
    expect(serialized).not.toContain("alert");
  });

  it("extracts categories and featured media from embedded WordPress payload", () => {
    const post = {
      _embedded: {
        "wp:featuredmedia": [
          { source_url: "https://tactyqal.com/media/sample.jpg", alt_text: "Sample cover" },
        ],
        "wp:term": [
          [
            { taxonomy: "category", name: "Startup Strategy &amp; Growth", slug: "startup-strategy" },
            { taxonomy: "post_tag", name: "Tag Should Be Ignored", slug: "ignored" },
          ],
        ],
      },
    };

    expect(extractCoverUrl(post)).toBe("https://tactyqal.com/media/sample.jpg");
    expect(extractCategories(post)).toEqual([
      { name: "Startup Strategy & Growth", slug: "startup-strategy" },
    ]);
  });

  it("maps a full WordPress post into the published schema", () => {
    const rawPost = {
      id: 9999,
      slug: "sample-startup-guide",
      title: { rendered: "How to Build a Startup in 2025 &amp; Beyond" },
      excerpt: { rendered: "<p>A quick guide for founders&#8230;</p>" },
      content: { rendered: "<p>First paragraph here.</p>" },
      date_gmt: "2025-05-01T12:00:00",
      link: "https://tactyqal.com/blog/sample-startup-guide",
      _embedded: {
        author: [{ name: "Alex Founder" }],
        "wp:featuredmedia": [{ source_url: "https://tactyqal.com/cover.png" }],
        "wp:term": [[{ taxonomy: "category", name: "Founders", slug: "founders" }]],
      },
    };

    const mapped = mapWordPressPost(rawPost);
    expect(mapped.title).toBe("How to Build a Startup in 2025 & Beyond");
    expect(mapped.slug).toBe("sample-startup-guide");
    expect(mapped.excerpt).toBe("A quick guide for founders…");
    expect(mapped.status).toBe("published");
    expect(mapped.published_at).toBe("2025-05-01T12:00:00.000Z");
    expect(mapped.cover_path).toBe("https://tactyqal.com/cover.png");
    expect(mapped.imported_author).toBe("Alex Founder");
    expect(mapped.imported_source_id).toBe("9999");
    expect(mapped.categories).toEqual([{ name: "Founders", slug: "founders" }]);
  });
});
