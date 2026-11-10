import type { Metadata } from "next";
import { listPublishedPosts, listPublicCategories } from "@/features/blog/server";
import { JournalFilters } from "@/features/blog/public-components/journal-filters";
import { JournalPagination } from "@/features/blog/public-components/journal-pagination";
import { JournalEmptyState, JournalErrorState } from "@/features/blog/public-components/journal-states";
import { PostCard } from "@/features/blog/public-components/post-card";
import { getCanonicalUrl } from "@/features/blog/public-components/urls";

// isolate service failures from route rendering so the error state stays explicit
async function loadJournalData(query: string, category: string, page: number, pageSize: number) {
  try {
    const [categories, result] = await Promise.all([
      listPublicCategories(),
      listPublishedPosts({ q: query || undefined, category: category || undefined, page, pageSize }),
    ]);
    return { categories, result };
  } catch {
    return null;
  }
}

// keep archive requests fresh so publishing and unpublishing take effect immediately
export const dynamic = "force-dynamic";

// describe the public archive without overriding the prototype wide noindex policy
export const metadata: Metadata = {
  title: "Journal",
  description: "Practical notes on finding a problem, building a first version, and learning from what happens next.",
  alternates: { canonical: getCanonicalUrl("/blog") },
};

// read filters from the url so archive searches remain shareable and refreshable
export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const queryValue = Array.isArray(params.q) ? params.q[0] : params.q;
  const categoryValue = Array.isArray(params.category) ? params.category[0] : params.category;
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const query = typeof queryValue === "string" ? queryValue.trim().slice(0, 100) : "";
  const category = typeof categoryValue === "string" ? categoryValue.trim().slice(0, 180) : "";
  const requestedPage = Number(pageValue);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1;
  const pageSize = 9;
  const archive = await loadJournalData(query, category, page, pageSize);

  if (!archive) {
    return (
      <section className="page-container py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Notes for the next step</p>
          <h1 className="section-heading mt-4">Ideas, tested in the real world.</h1>
          <p className="mb-8 mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Practical resources about finding a problem, building a first version, and learning from what happens next.
          </p>
          <p className="mb-6 text-xs text-muted">Articles migrated from the existing Tactyqal blog.</p>
          <JournalErrorState />
        </div>
      </section>
    );
  }

  const { categories, result } = archive;
  const hasFilters = Boolean(query || category);
  const pageCount = Math.ceil(result.total / result.pageSize);
  const rangeStart = result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const rangeEnd = Math.min(result.page * result.pageSize, result.total);

  return (
    <section className="page-container py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">Notes for the next step</p>
        <h1 className="section-heading mt-4 max-w-3xl">Ideas, tested in the real world.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Practical resources about finding a problem, building a first version, and learning from what happens next.
        </p>
        <p className="mt-3 text-xs text-muted">Articles migrated from the existing Tactyqal blog.</p>

        <div className="mt-9">
          <JournalFilters categories={categories} query={query} selectedCategory={category} />
        </div>

        <div className="mb-5 mt-9 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-2xl">The Journal</h2>
          <p aria-live="polite" className="text-sm text-muted">
            {result.total ? `Showing ${rangeStart}–${rangeEnd} of ${result.total} ${result.total === 1 ? "article" : "articles"}` : "0 articles"}
          </p>
        </div>

        {result.items.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <JournalEmptyState hasFilters={hasFilters} />
        )}

        <JournalPagination page={result.page} pageCount={pageCount} query={query} category={category} />
      </div>
    </section>
  );
}
