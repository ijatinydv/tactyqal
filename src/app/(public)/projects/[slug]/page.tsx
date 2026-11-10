import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectArtwork } from "@/features/marketing/components/project-artwork";
import { projectStories } from "@/content/projects";

// describe project pages honestly in search results before rendering their concept details
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projectStories.find((story) => story.slug === slug);

  if (!project) return { title: "Project study not found", robots: { index: false, follow: false } };
  return { title: project.title, description: project.summary };
}

// provide a focused case-study structure while keeping unknown slugs genuinely missing
export default async function ProjectStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectStories.find((story) => story.slug === slug);
  if (!project) notFound();

  return (
    <section className="page-container py-10 sm:py-16">
      <Link href="/projects" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline decoration-border underline-offset-4 hover:decoration-brand">← All project studies</Link>
      <header className="mt-8 grid items-end gap-7 border-b border-border pb-9 md:grid-cols-[1fr_auto]">
        <div><p className="eyebrow">Illustrative concept · not verified student work</p><h1 className="display-heading mt-4">{project.title}</h1><p className="mt-4 text-lg text-muted">{project.label}</p></div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">An original example created to explore a possible project direction. This is not a built product or a report of learner results.</p>
      </header>
      <ProjectArtwork project={project} className="mt-8" />
      <p className="mt-3 text-xs leading-relaxed text-muted">Original illustration for a hypothetical project concept. No real product screen or student work is shown.</p>
      <section className="grid gap-9 border-b border-border py-10 md:grid-cols-[0.7fr_1fr] md:gap-16">
        <div><p className="eyebrow">The question</p><h2 className="section-heading mt-3">A small problem worth noticing.</h2></div>
        <p className="max-w-2xl text-base leading-relaxed text-muted">{project.problem}</p>
      </section>
      <section className="grid gap-9 border-b border-border py-10 md:grid-cols-[0.7fr_1fr] md:gap-16">
        <div><p className="eyebrow">A possible approach</p><h2 className="section-heading mt-3">Keep the first version focused.</h2></div>
        <ol className="space-y-5">{project.approach.map((step, index) => <li key={step} className="grid grid-cols-[2rem_1fr] gap-4"><span className="font-heading text-2xl text-brand">0{index + 1}</span><p className="leading-relaxed text-muted">{step}</p></li>)}</ol>
      </section>
      <section className="grid gap-9 py-10 md:grid-cols-[0.7fr_1fr] md:gap-16">
        <div><p className="eyebrow">Learning prompts</p><h2 className="section-heading mt-3">What this idea could teach.</h2></div>
        <ul className="space-y-4">{project.learning.map((lesson) => <li key={lesson} className="flex gap-3 leading-relaxed text-muted"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />{lesson}</li>)}</ul>
      </section>
      <aside className="border-y border-border bg-[#f4f2ec] px-6 py-7 sm:px-9">
        <p className="eyebrow">For families</p><p className="mt-3 max-w-3xl leading-relaxed text-muted">A project starts with questions, sketches, and small decisions. This example is here to make that process tangible—not to promise a particular outcome.</p>
      </aside>
      <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3"><Link href="/projects" className="min-h-11 inline-flex items-center font-semibold text-brand underline underline-offset-4">Browse both studies →</Link><Link href="/contact" className="min-h-11 inline-flex items-center font-semibold text-brand underline underline-offset-4">Read consultation information →</Link></div>
    </section>
  );
}
