// model only the rich text structures the blog renderer can safely display
export type RichTextMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "link"; attrs: { href: string } };

// keep text nodes separate so content extraction never interprets markup
export type RichTextNode = { type: "text"; text: string; marks?: RichTextMark[] };

// describe the small block vocabulary accepted from the editor
export type RichBlockNode =
  | { type: "paragraph"; content: RichTextNode[] }
  | { type: "heading"; attrs: { level: 2 | 3 }; content: RichTextNode[] }
  | { type: "bulletList" | "orderedList"; content: RichListItem[] }
  | { type: "listItem"; content: RichBlockNode[] };

// allow nested lists while retaining a renderer-friendly document shape
export type RichListItem = { type: "listItem"; content: RichBlockNode[] };

// guarantee shared readers and writers agree on the persisted document root
export type RichDocument = { type: "doc"; content: RichBlockNode[] };

// expose only stable category fields in browser and server-rendered contracts
export type Category = { id: string; name: string; slug: string };

// keep the persisted post shape identical across API and server-rendered consumers
export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: RichDocument;
  author_id: string | null;
  cover_path: string | null;
  cover_alt: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories: Category[];
};

// prevent archive cards from carrying full article bodies
export type PostSummary = Omit<Post, "content"> & { reading_time: number };

// keep pagination metadata consistent for both public and editor archives
export type PostList = { items: PostSummary[]; total: number; page: number; pageSize: number };

// share one validated editor payload between create, patch, and database writes
export type SavePostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: RichDocument;
  status: "draft" | "published";
  category_ids: string[];
  cover_path: string | null;
  cover_alt: string;
};

// permit partial editor updates before the service merges persisted values
export type PatchPostInput = Partial<SavePostInput>;

// bind admin filters to supported database status values
export type AdminPostListOptions = {
  q?: string;
  category?: string;
  status?: "draft" | "published";
  page?: number;
  pageSize?: number;
};

// share public archive filters without exposing editorial-only status
export type PublicPostListOptions = Omit<AdminPostListOptions, "status">;
