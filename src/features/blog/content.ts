import type { RichBlockNode, RichDocument, RichTextNode } from "./types";

// extract reader-visible words without interpreting or emitting html
export function extractDocumentText(document: RichDocument): string {
  // retain list item text so summaries and publication checks reflect the actual article
  const collectBlock = (node: RichBlockNode): string => {
    if (node.type === "paragraph" || node.type === "heading") {
      return node.content.map((text: RichTextNode) => text.text).join("");
    }
    return node.content.map(collectBlock).join(" ");
  };

  return document.content.map(collectBlock).join(" ").replace(/\s+/g, " ").trim();
}

// estimate reading time consistently for each public archive card
export function readingTimeMinutes(document: RichDocument): number {
  const wordCount = extractDocumentText(document).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
