import type { ReactNode } from "react";
import type { RichDocument } from "@/features/blog/shared";

// define a narrow runtime shape for validating stored structured content
type ContentRecord = Record<string, unknown>;

// narrow rich document values before interpreting untrusted editorial content
function isRecord(value: unknown): value is ContentRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// collect only serialized text nodes when estimating the visible article length
function extractPlainText(value: unknown): string {
  if (Array.isArray(value)) return value.map(extractPlainText).join(" ");
  if (!isRecord(value)) return "";
  if (value.type === "text" && typeof value.text === "string") return value.text;
  return extractPlainText(value.content);
}

// estimate a modest reading duration without requiring stored or invented metadata
export function estimateReadingTime(content: RichDocument): number {
  const words = extractPlainText(content).trim().match(/\S+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(words / 200));
}

// accept only links that cannot change the page into executable browser content
function safeHref(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const href = value.trim();
  if (!href) return undefined;

  try {
    const url = new URL(href);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

// render only the explicitly supported editorial nodes and marks
function renderNode(value: unknown, key: string | number): ReactNode {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  if (value.type === "text") {
    let rendered: ReactNode = typeof value.text === "string" ? value.text : null;
    const marks = Array.isArray(value.marks) ? value.marks : [];

    for (const [index, markValue] of marks.entries()) {
      if (!isRecord(markValue) || typeof markValue.type !== "string") continue;
      if (markValue.type === "bold") rendered = <strong key={`${key}-bold-${index}`}>{rendered}</strong>;
      if (markValue.type === "italic") rendered = <em key={`${key}-italic-${index}`}>{rendered}</em>;
      if (markValue.type === "link") {
        const attrs = isRecord(markValue.attrs) ? markValue.attrs : {};
        const href = safeHref(attrs.href);
        if (href) {
          const external = /^https?:/i.test(href);
          rendered = <a key={`${key}-link-${index}`} href={href} rel="noopener noreferrer" target={external ? "_blank" : undefined} className="text-brand underline underline-offset-4">{rendered}</a>;
        }
      }
    }
    return <span key={key}>{rendered}</span>;
  }

  const children = Array.isArray(value.content)
    ? value.content.map((child, index) => renderNode(child, `${key}-${index}`))
    : null;

  switch (value.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return <p key={key} className="my-6 leading-8 text-ink/90">{children}</p>;
    case "heading": {
      const attrs = isRecord(value.attrs) ? value.attrs : {};
      const headingClassName = attrs.level === 3
        ? "mb-4 mt-9 font-heading text-2xl leading-tight tracking-tight"
        : "mb-5 mt-12 font-heading text-3xl leading-tight tracking-tight";
      return attrs.level === 3
        ? <h3 key={key} className={headingClassName}>{children}</h3>
        : <h2 key={key} className={headingClassName}>{children}</h2>;
    }
    case "bulletList":
      return <ul key={key} className="my-6 list-disc space-y-2 pl-7 leading-7 text-ink/90">{children}</ul>;
    case "orderedList":
      return <ol key={key} className="my-6 list-decimal space-y-2 pl-7 leading-7 text-ink/90">{children}</ol>;
    case "listItem":
      return <li key={key} className="pl-1">{children}</li>;
    default:
      return <>{children}</>;
  }
}

// expose a typed article renderer shared by published pages and protected previews
export function ArticleContent({ content }: { content: RichDocument }) {
  return <div className="article-content">{renderNode(content, "document")}</div>;
}
