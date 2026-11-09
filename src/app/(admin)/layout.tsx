import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { logoutAction } from "@/features/auth/actions";
import { requireEditor } from "@/features/auth/server";

// keep private editorial workspace pages out of search results
export const metadata: Metadata = {
  title: { default: "Editor workspace", template: "%s | Editor" },
  robots: { index: false, follow: false },
};

// render the workspace dynamically so no editor response is reused across requests
export const dynamic = "force-dynamic";

// disable cached server data throughout the protected workspace
export const revalidate = 0;

// provide compact mobile navigation and editor-only workspace framing
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const editor = await requireEditor();
  if (!editor) {
    return <main id="main-content" className="page-container max-w-3xl py-16"><Link href="/" className="wordmark">tactyqal</Link><ConfigurationNotice /></main>;
  }

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="border-b border-control-border bg-white px-5 py-5 lg:flex lg:min-h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
        <Link href="/admin" className="wordmark">tactyqal</Link>
        <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted">Editor workspace</p>
        <nav aria-label="Editor navigation" className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col">
          <Link href="/admin" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-surface-muted">Overview</Link>
          <Link href="/admin/posts" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-surface-muted">Posts</Link>
          <Link href="/admin/inquiries" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-surface-muted">Inquiries</Link>
        </nav>
        <div className="mt-4 flex flex-wrap items-center gap-3 lg:mt-auto lg:block">
          <Link href="/" className="inline-flex min-h-11 items-center px-3 text-sm text-brand underline">View site</Link>
          <form action={logoutAction} className="lg:mt-3">
            <Button type="submit" variant="secondary">Sign out</Button>
          </form>
        </div>
        <p className="mt-4 break-all text-xs text-muted" aria-label="Signed-in editor">{editor.user.email ?? "Editor"}</p>
      </aside>
      <main id="main-content" className="min-w-0 px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
