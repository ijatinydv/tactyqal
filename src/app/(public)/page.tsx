import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectIllustration } from "@/features/marketing/components/project-illustration";
import { programStages } from "@/content/program";

// establish the actual public shell without pretending later database features are complete
export default function HomePage() {
  return <>
    <section className="page-container grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
      <div><p className="eyebrow">Personalised mentoring for young builders</p><h1 className="display-heading mt-5">An idea is a good start.<br />Build what comes next.</h1><p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">Turn your idea into a working app through eight weeks of one-to-one mentoring—from understanding the problem to sharing your first launch.</p>
        <div className="mt-7 flex flex-wrap items-center gap-4"><Button asChild><Link href="/contact">Request a free consultation</Link></Button><Button variant="ghost" asChild><Link href="/projects">Explore the projects →</Link></Button></div><p className="mt-6 text-xs leading-relaxed text-muted sm:text-sm">Eight weeks · One-to-one guidance · Beginner-friendly</p></div>
      <ProjectIllustration />
    </section>
    <section id="program" className="border-y border-border py-14 sm:py-20"><div className="page-container"><p className="eyebrow">The eight-week journey</p><h2 className="section-heading mt-4">A little structure.<br />A lot of making.</h2><ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{programStages.map((stage, index) => <li key={stage.weeks} className="border-t border-border pt-5"><p className="font-heading text-3xl text-brand">0{index + 1}</p><p className="mt-3 text-xs text-muted">Weeks {stage.weeks}</p><h3 className="mt-2 font-semibold">{stage.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{stage.description}</p></li>)}</ol><p className="mt-8 text-xs leading-relaxed text-muted">Proposed activities based on the public curriculum. Admissions, income, and commercial outcomes are not guaranteed.</p></div></section>
    <section id="faq" className="page-container py-14 sm:py-20"><p className="eyebrow">Before you begin</p><h2 className="section-heading mt-4">A few practical questions.</h2><div className="mt-8 max-w-3xl"><details className="border-t border-border py-5"><summary className="cursor-pointer py-1 font-semibold">Do I need coding experience?</summary><p className="mt-4 leading-relaxed text-muted">The current program is described as beginner-friendly and uses no-code tools. Discuss the right approach for your idea before joining.</p></details><details className="border-y border-border py-5"><summary className="cursor-pointer py-1 font-semibold">How do I learn about fees and availability?</summary><p className="mt-4 leading-relaxed text-muted">Current terms need confirmation. This independent prototype does not take payments or reserve a place.</p></details></div><p className="mt-8 text-sm text-muted">The full homepage and live Journal are delivered in later chunks. This is the application foundation, not a completed submission.</p></section>
  </>;
}
