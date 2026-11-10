import Link from "next/link";

// retain active archive filters while moving between bounded result pages
export function JournalPagination({
  page,
  pageCount,
  query,
  category,
}: {
  page: number;
  pageCount: number;
  query: string;
  category: string;
}) {
  if (pageCount < 2) return null;

  // keep the active topic and search intact when readers change result pages
  const hrefForPage = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (targetPage > 1) params.set("page", String(targetPage));
    return `/blog?${params.toString()}`;
  };

  return (
    <nav aria-label="Article pages" className="mt-12 flex flex-wrap items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} rel="prev" className="rounded-full border border-control-border px-4 py-2 font-semibold text-brand hover:bg-surface">
          Previous
        </Link>
      ) : null}
      <p aria-live="polite" className="px-2 text-sm text-muted">Page {page} of {pageCount}</p>
      {page < pageCount ? (
        <Link href={hrefForPage(page + 1)} rel="next" className="rounded-full border border-control-border px-4 py-2 font-semibold text-brand hover:bg-surface">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
