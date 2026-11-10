import Link from "next/link";
import type { Category } from "@/features/blog/shared";

// keep archive filters usable with native controls and ordinary get navigation
export function JournalFilters({
  categories,
  query,
  selectedCategory,
}: {
  categories: Category[];
  query: string;
  selectedCategory: string;
}) {
  const hasFilters = Boolean(query || selectedCategory);

  return (
    <section aria-label="Filter articles" className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <form action="/blog" method="get" className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.7fr)_auto] sm:items-end">
        <div>
          <label htmlFor="journal-q" className="mb-2 block text-sm font-semibold">Search articles</label>
          <input
            id="journal-q"
            name="q"
            type="search"
            key={query}
            defaultValue={query}
            maxLength={100}
            placeholder="Try a topic or idea"
            className="w-full rounded-lg border border-control-border bg-white px-4 py-3 text-ink placeholder:text-muted"
          />
        </div>
        <div>
          <label htmlFor="journal-category" className="mb-2 block text-sm font-semibold">Category</label>
          <select
            id="journal-category"
            name="category"
            defaultValue={selectedCategory}
            className="w-full rounded-lg border border-control-border bg-white px-4 py-3 text-ink"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-hover">
          Apply filters
        </button>
      </form>
      {hasFilters ? (
        <div className="mt-4 border-t border-border pt-4">
          <Link href="/blog" className="font-semibold text-brand underline underline-offset-4">Clear filters</Link>
        </div>
      ) : null}
    </section>
  );
}
