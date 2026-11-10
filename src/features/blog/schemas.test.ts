import { describe, expect, it } from "vitest";
import { createPostSchema, patchPostSchema, safeRichDocumentSchema } from "./schemas";

// protect the editor boundary from unsafe or structurally unsupported documents
describe("blog content schemas", () => {
  // keep the renderer input limited to the supported document vocabulary
  it("accepts constrained paragraphs, headings, lists, and safe marks", () => {
    const document = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A useful title" }] },
        { type: "paragraph", content: [{ type: "text", text: "A linked idea", marks: [{ type: "link", attrs: { href: "https://example.com/guide" } }] }] },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "One point" }] }] }] },
      ],
    };

    expect(safeRichDocumentSchema.safeParse(document).success).toBe(true);
  });

  // reject html nodes and other element types that could bypass the renderer
  it("rejects html nodes and unsafe links", () => {
    expect(safeRichDocumentSchema.safeParse({ type: "doc", content: [{ type: "html", text: "<script>" }] }).success).toBe(false);
    expect(safeRichDocumentSchema.safeParse({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }],
    }).success).toBe(false);
  });

  // reject excessive nesting, unknown properties, and oversized text before persistence
  it("bounds depth, node fields, and text length", () => {
    const tooDeep = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", onClick: "run" }] }] };
    const tooLong = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(20001) }] }] };

    expect(safeRichDocumentSchema.safeParse(tooDeep).success).toBe(false);
    expect(safeRichDocumentSchema.safeParse(tooLong).success).toBe(false);
  });

  // keep draft authoring permissive while requiring substance before publication
  it("allows an empty draft but rejects a published empty body", () => {
    const fields = {
      title: "A clear title",
      slug: "a-clear-title",
      excerpt: "A concise summary",
      content: { type: "doc", content: [] },
      category_ids: [],
      cover_path: null,
      status: "draft",
    };

    expect(createPostSchema.safeParse(fields).success).toBe(true);
    expect(createPostSchema.safeParse({ ...fields, status: undefined }).data?.status).toBe("draft");
    expect(createPostSchema.safeParse({ ...fields, status: "published" }).success).toBe(false);
  });

  // require complete create data while preserving useful partial editor updates
  it("accepts nonempty patches and rejects empty or malformed patches", () => {
    expect(patchPostSchema.safeParse({ excerpt: "Updated summary" }).success).toBe(true);
    expect(patchPostSchema.safeParse({}).success).toBe(false);
    expect(patchPostSchema.safeParse({ status: "deleted" }).success).toBe(false);
  });
});
