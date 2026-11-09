import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { requireEditor } from "@/features/auth/server";

// show an honest empty workspace until database-backed editorial summaries exist
export default async function AdminOverviewPage() {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;

  return (
    <section aria-labelledby="overview-heading">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">Editorial</p>
      <h1 id="overview-heading" className="section-heading mt-3">Overview</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Your editorial workspace is ready. Published content and activity summaries will appear when the editorial workflow is connected; no placeholder counts are shown.
      </p>
    </section>
  );
}
