import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { requireEditor } from "@/features/auth/server";

// keep post management explicitly empty until the real editorial workflow is delivered
export default async function AdminPostsPage() {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;

  return (
    <section aria-labelledby="posts-heading">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">Editorial</p>
      <h1 id="posts-heading" className="section-heading mt-3">Posts</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Post listing and editing are not available yet. No sample articles or non-persistent save controls are shown.
      </p>
    </section>
  );
}
