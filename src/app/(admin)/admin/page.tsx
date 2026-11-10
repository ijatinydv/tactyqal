import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { requireEditor } from "@/features/auth/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// show honest next steps without inventing workspace metrics
export default async function AdminOverviewPage() {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;

  return (
    <section aria-labelledby="overview-heading">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">Editorial</p>
      <h1 id="overview-heading" className="section-heading mt-3">Overview</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Manage saved articles from this private workspace. Review consultation requests in the private inbox.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-heading text-2xl">Posts</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Create drafts, edit articles, and publish updates to the Journal.</p>
          <Button asChild variant="secondary" className="mt-4"><Link href="/admin/posts">Manage posts</Link></Button>
        </section>
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-heading text-2xl">Inquiries</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Review synthetic adult requests, update their status, or delete their stored contact details.</p>
          <Button asChild variant="secondary" className="mt-4"><Link href="/admin/inquiries">Open inquiries</Link></Button>
        </section>
      </div>
    </section>
  );
}
