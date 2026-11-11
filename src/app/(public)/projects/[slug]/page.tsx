import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { studentApps } from "@/content/students";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const app = studentApps.find((item) => item.slug === slug);
  if (!app) return { title: "Student app not found", robots: { index: false, follow: false } };
  return { title: app.name, description: app.description };
}

export default async function StudentAppPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = studentApps.find((item) => item.slug === slug);
  if (!app) notFound();

  return (
    <section className="page-container max-w-3xl py-10 sm:py-16">
      <Link href="/projects" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline decoration-border underline-offset-4 hover:decoration-brand">
        ← All student apps
      </Link>
      <header className="mt-6">
        <p className="eyebrow">Student app</p>
        <h1 className="display-heading mt-4">{app.name}</h1>
        {app.startedBy ? <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-brand">{app.startedBy}</p> : null}
      </header>
      <div className="relative mt-8 aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
        <Image src={app.image} alt={`Screenshot of the ${app.name} app`} fill sizes="(min-width: 768px) 48rem, 100vw" className="object-cover" />
      </div>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">{app.description}</p>
      <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
        <Link href="/projects" className="min-h-11 inline-flex items-center font-semibold text-brand underline underline-offset-4">Browse all student apps →</Link>
        <Link href="/contact" className="min-h-11 inline-flex items-center font-semibold text-brand underline underline-offset-4">Book a free consultation →</Link>
      </div>
    </section>
  );
}
