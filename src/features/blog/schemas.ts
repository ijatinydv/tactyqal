import { z } from "zod";
import { extractDocumentText } from "./content";
import type { RichDocument } from "./types";

// reject unknown JSON structures before any content reaches a renderer
const documentRootSchema = z.object({ type: z.literal("doc"), content: z.array(z.unknown()).max(150) }).strict();

// allow only safe http links and the two supported inline text marks
const allowedMarksSchema = z.array(z.union([
  z.object({ type: z.literal("bold") }).strict(),
  z.object({ type: z.literal("italic") }).strict(),
  z.object({
    type: z.literal("link"),
    attrs: z.object({
      href: z.string().url().max(2048).refine((value) => {
        try {
          return ["http:", "https:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      }, "Link must use http or https"),
    }).strict(),
  }).strict(),
])).max(2);

// validate document node vocabulary and bound data before storing rich content
export const safeRichDocumentSchema = documentRootSchema.superRefine((document, context) => {
  const serialized = JSON.stringify(document);
  if (new TextEncoder().encode(serialized).byteLength > 131072) {
    context.addIssue({ code: "custom", path: [], message: "Document exceeds the 128 KiB limit" });
  }

  const allowedChildren: Record<string, readonly string[]> = {
    doc: ["paragraph", "heading", "bulletList", "orderedList"],
    paragraph: ["text"],
    heading: ["text"],
    bulletList: ["listItem"],
    orderedList: ["listItem"],
    listItem: ["paragraph", "heading", "bulletList", "orderedList"],
  };
  const stack = document.content.map((node, index) => ({ node, parent: "doc", depth: 1, path: ["content", index] }));
  let nodeCount = 0;
  let textLength = 0;

  while (stack.length > 0) {
    const entry = stack.pop();
    if (!entry) continue;
    nodeCount += 1;
    if (nodeCount > 150) {
      context.addIssue({ code: "custom", path: entry.path, message: "Document has too many nodes" });
      break;
    }
    if (entry.depth > 8) {
      context.addIssue({ code: "custom", path: entry.path, message: "Document nesting is too deep" });
      continue;
    }
    if (typeof entry.node !== "object" || entry.node === null || Array.isArray(entry.node)) {
      context.addIssue({ code: "custom", path: entry.path, message: "Document node must be an object" });
      continue;
    }

    const node = entry.node as Record<string, unknown>;
    const type = node.type;
    if (typeof type !== "string" || !allowedChildren[entry.parent]?.includes(type)) {
      context.addIssue({ code: "custom", path: [...entry.path, "type"], message: "Unsupported document node" });
      continue;
    }
    const expectedKeys = type === "text" ? ["type", "text", "marks"] : type === "heading" ? ["type", "attrs", "content"] : ["type", "content"];
    if (Object.keys(node).some((key) => !expectedKeys.includes(key))) {
      context.addIssue({ code: "custom", path: entry.path, message: "Document node contains unsupported fields" });
    }

    if (type === "text") {
      if (typeof node.text !== "string" || node.text.length > 20000) {
        context.addIssue({ code: "custom", path: [...entry.path, "text"], message: "Text must be at most 20000 characters" });
      } else {
        textLength += node.text.length;
      }
      if (node.marks !== undefined) {
        const parsedMarks = allowedMarksSchema.safeParse(node.marks);
        if (!parsedMarks.success) {
          context.addIssue({ code: "custom", path: [...entry.path, "marks"], message: "Text marks are invalid" });
        }
      }
      continue;
    }

    if (type === "heading") {
      const attrs = node.attrs;
      if (typeof attrs !== "object" || attrs === null || Array.isArray(attrs)
        || Object.keys(attrs).length !== 1 || ![2, 3].includes((attrs as { level?: number }).level ?? 0)) {
        context.addIssue({ code: "custom", path: [...entry.path, "attrs", "level"], message: "Heading level must be 2 or 3" });
      }
    }

    if (!Array.isArray(node.content) || node.content.length > 50) {
      context.addIssue({ code: "custom", path: [...entry.path, "content"], message: "Node content must be an array of at most 50 items" });
      continue;
    }
    node.content.forEach((child, index) => stack.push({
      node: child,
      parent: type,
      depth: entry.depth + 1,
      path: [...entry.path, "content", index],
    }));
  }

  if (textLength > 50000) {
    context.addIssue({ code: "custom", path: ["content"], message: "Document text exceeds 50000 characters" });
  }
}).transform((document) => document as RichDocument);

// reject unsafe object paths before they can be rendered as public media
const coverPathSchema = z.string().max(512).regex(/^[A-Za-z0-9_-]+\/[A-Za-z0-9][A-Za-z0-9._-]{0,240}$/).refine(
  (path) => !path.split("/").some((segment) => segment === "." || segment === ".."),
  "Cover path must not traverse directories",
);

// validate every persisted editor field against both product and database bounds
const savePostFieldsSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().min(1).max(320),
  content: safeRichDocumentSchema,
  status: z.enum(["draft", "published"]),
  category_ids: z.array(z.string().uuid()).max(10).refine((ids) => new Set(ids).size === ids.length, "Category ids must be unique"),
  cover_path: coverPathSchema.nullable(),
  cover_alt: z.string().trim().max(200).optional(),
}).strict();

// require published articles to contain meaningful reader-facing text
export const createPostSchema = savePostFieldsSchema.extend({ status: z.enum(["draft", "published"]).default("draft") }).superRefine((post, context) => {
  if (post.status === "published" && extractDocumentText(post.content).length < 80) {
    context.addIssue({ code: "custom", path: ["content"], message: "Published posts need at least 80 characters of body text" });
  }
}).transform((post) => ({ ...post, cover_alt: post.cover_alt ?? "" }));

// accept editor patches while leaving complete-entity validation to the merge service
export const patchPostSchema = savePostFieldsSchema.partial().superRefine((post, context) => {
  if (Object.keys(post).length === 0) {
    context.addIssue({ code: "custom", path: [], message: "At least one editable field is required" });
  }
  if (post.status === "published" && post.content && extractDocumentText(post.content).length < 80) {
    context.addIssue({ code: "custom", path: ["content"], message: "Published posts need at least 80 characters of body text" });
  }
});

// bound archive pagination and filters before querying the database
const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  page: z.string().regex(/^[1-9][0-9]{0,4}$/).transform(Number).optional(),
  pageSize: z.string().regex(/^(?:[1-9]|1[0-9]|20)$/).transform(Number).optional(),
}).strict();

// expose public archive parameters without any draft-status filter
export const publicListQuerySchema = listQuerySchema;

// allow editors to filter by status while retaining the same bounded archive contract
export const adminListQuerySchema = listQuerySchema.extend({ status: z.enum(["draft", "published"]).optional() }).strict();

// report the first user-facing validation message for each affected field
export function validationFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "body";
    fields[key] ??= issue.message;
  }
  return fields;
}
