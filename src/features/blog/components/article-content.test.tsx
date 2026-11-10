import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleContent } from "./article-content";

// preserve safe article semantics for the canonical structured document shared by editor and public pages
 describe("ArticleContent", () => {
  // prevent the editor and reader from drifting to incompatible heading node representations
  it("renders canonical heading levels and list items", () => {
    render(<ArticleContent content={{ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A useful question" }] },
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "A smaller step" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Listen first" }] }] }] },
    ] }} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("A useful question");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("A smaller step");
    expect(screen.getByRole("listitem")).toHaveTextContent("Listen first");
  });
  // keep historical or directly stored text from becoming executable markup or an unsafe navigation target
  it("escapes markup text and refuses unsafe link protocols", () => {
    const { container } = render(<ArticleContent content={{ type: "doc", content: [{ type: "paragraph", content: [
      { type: "text", text: "<script>not executable</script>" },
      { type: "text", text: "Unsafe link", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
      { type: "text", text: "Safe reference", marks: [{ type: "link", attrs: { href: "https://example.com/" } }] },
    ] }] }} />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(/not executable/)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Unsafe link" })).toBeNull();
    expect(screen.getByRole("link", { name: "Safe reference" })).toHaveAttribute("href", "https://example.com/");
  });
});
