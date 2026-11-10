import Link from "next/link";

// communicate archive failures without presenting them as successful empty results
export function JournalErrorState() {
  return (
    <section role="alert" className="rounded-2xl border border-danger/30 bg-white p-8 sm:p-10">
      <p className="eyebrow text-danger">Journal unavailable</p>
      <h2 className="mt-3 font-heading text-3xl">We couldn’t load the articles.</h2>
      <p className="mt-3 max-w-xl leading-relaxed text-muted">Please try again in a little while. The published archive has not been changed by this error.</p>
      <Link href="/blog" className="mt-6 inline-flex rounded-lg bg-brand px-5 py-3 font-semibold text-white no-underline hover:bg-brand-hover">Try again</Link>
    </section>
  );
}

// distinguish an empty archive from a search with no matching published articles
export function JournalEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-6 py-12 text-center sm:px-10">
      <p className="eyebrow">{hasFilters ? "No matches" : "A journal in progress"}</p>
      <h2 className="mt-3 font-heading text-3xl">{hasFilters ? "No articles fit those filters." : "The next story is still taking shape."}</h2>
      <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted">
        {hasFilters
          ? "Try a different search or category to see more of the published Journal."
          : "Published articles will appear here when they are ready to share."}
      </p>
      {hasFilters ? <Link href="/blog" className="mt-5 inline-flex font-semibold text-brand underline underline-offset-4">Clear filters</Link> : null}
    </section>
  );
}
