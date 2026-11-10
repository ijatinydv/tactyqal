import type { Metadata } from "next";
import Link from "next/link";
import { ProjectArtwork } from "@/features/marketing/components/project-artwork";
import { projectStories } from "@/content/projects";

// introduce the sample project ideas as editorial studies rather than outcome claims
export const metadata: Metadata = {
  title: "Project studies",
  description: "Explore two original illustrative project concepts and the questions behind them.",
};

// make the project collection a useful starting point for curious builders and families
export default function ProjectsPage() {
  return (
    <section className="page-container py-12 sm:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">Project studies · illustrative concepts</p>
        <h1 className="display-heading mt-5">Start with a question.<br />Make it something.</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">These original concept studies show how an everyday observation can become a focused project idea. They are not student work, completed products, or claims about learner outcomes.</p>
      </header>
      <div className="mt-12 grid gap-12 border-t border-border pt-8 lg:grid-cols-2 lg:gap-8">
        {projectStories.map((project, index) => (
          <article key={project.slug} className="flex flex-col">
            <Link href={`/projects/${project.slug}`} className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
              <ProjectArtwork project={project} className="transition-opacity group-hover:opacity-90" />
              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-muted">Study 0{index + 1} · {project.label}</p>
              <h2 className="mt-2 font-heading text-3xl text-ink group-hover:text-brand">{project.title} <span aria-hidden="true">↗</span></h2>
            </Link>
            <p className="mt-3 max-w-xl leading-relaxed text-muted">{project.summary}</p>
            <Link href={`/projects/${project.slug}`} className="mt-5 inline-flex min-h-11 items-center self-start font-semibold text-brand underline decoration-border underline-offset-4 hover:decoration-brand">Explore the study <span className="ml-2" aria-hidden="true">→</span></Link>
          </article>
        ))}
      </div>
      <p className="mt-12 border-t border-border pt-5 text-sm leading-relaxed text-muted">Both studies are authored examples created for this prototype. No learner, mentor, or project history is represented.</p>
    </section>
  );
}
