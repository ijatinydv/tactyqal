import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LatestPosts } from "@/features/marketing/components/latest-posts";
import { ProjectArtwork } from "@/features/marketing/components/project-artwork";
import { programStages } from "@/content/program";
import { projectStories } from "@/content/projects";

// keep the latest published journal entries current without rebuilding the homepage
export const dynamic = "force-dynamic";

// explain the mentoring journey and its concept work without implying guaranteed results
export default function HomePage() {
  return (
    <>
      <section className="page-container grid items-center gap-9 py-9 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Tactyqal Builder’s Studio · mentoring for young builders</p>
          <h1 className="display-heading mt-5">An idea is a good start.<br /><span className="text-brand">Build what comes next.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">A considered path from a real-world question to a first project. The current program outline describes eight weeks of one-to-one mentoring; the work begins with curiosity, not coding experience.</p>
          <div className="mt-7 flex flex-col items-stretch gap-3 min-[440px]:flex-row min-[440px]:items-center">
            <Button asChild><Link href="/contact">Request a free consultation</Link></Button>
            <Button variant="ghost" asChild><Link href="/projects">Explore project studies <span aria-hidden="true">→</span></Link></Button>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">The studies shown are original illustrative concepts—not student stories, completed products, or promised outcomes.</p>
        </div>
        <Link href={`/projects/${projectStories[0].slug}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <ProjectArtwork project={projectStories[0]} className="shadow-[12px_12px_0_0_#dce5d8] sm:shadow-[20px_20px_0_0_#dce5d8]" />
          <p className="mt-7 text-xs uppercase tracking-[0.16em] text-muted">A possible project · Neighbourhood Library</p>
        </Link>
      </section>

      <section id="program" className="border-y border-border bg-[#f4f2ec] py-12 sm:py-18">
        <div className="page-container">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div><p className="eyebrow">The eight-week outline</p><h2 className="section-heading mt-4">A little structure.<br />Room to explore.</h2></div>
            <p className="max-w-2xl leading-relaxed text-muted">The current Tactyqal website describes a one-to-one journey that moves from understanding a problem to sharing an early version. These are proposed stages, not a promise of a particular launch or result.</p>
          </div>
          <ol className="mt-9 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {programStages.map((stage, index) => (
              <li key={stage.weeks} className="border-t border-border pt-4">
                <p className="font-heading text-3xl text-brand">0{index + 1}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.12em] text-muted">Weeks {stage.weeks}</p>
                <h3 className="mt-2 font-semibold text-ink">{stage.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{stage.description}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted">Source: the current Tactyqal program outline. Session format, admissions, fees, schedule, and availability require confirmation.</p>
        </div>
      </section>

      <section className="page-container py-12 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow">A couple of starting points</p><h2 className="section-heading mt-4">Ordinary places.<br />Interesting questions.</h2></div>
          <Link href="/projects" className="inline-flex min-h-11 items-center self-start font-semibold text-brand underline underline-offset-4 sm:self-auto">All project studies <span className="ml-2" aria-hidden="true">→</span></Link>
        </div>
        <div className="mt-8 grid gap-10 border-t border-border pt-7 md:grid-cols-2 md:gap-8">
          {projectStories.map((project, index) => (
            <article key={project.slug} className="grid items-start gap-5 sm:grid-cols-[1fr_1fr] sm:gap-6">
              <Link href={`/projects/${project.slug}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                <ProjectArtwork project={project} />
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Concept 0{index + 1}</p>
                <h3 className="mt-2 font-heading text-2xl text-ink"><Link href={`/projects/${project.slug}`} className="hover:text-brand">{project.title}</Link></h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{project.summary}</p>
                <Link href={`/projects/${project.slug}`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">See the thinking →</Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-7 text-xs leading-relaxed text-muted">Both examples are illustrative concepts created for this prototype, not verified student achievements.</p>
      </section>

      <section className="border-y border-border bg-[#e9eee8] py-12 sm:py-18">
        <div className="page-container grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-start">
          <div><p className="eyebrow">A note for parents and guardians</p><h2 className="section-heading mt-4">Clear expectations matter.</h2></div>
          <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
            <p>The outline is a starting point for a conversation, not a complete service agreement. Before making a decision, ask about the young person’s fit, how sessions work, safeguarding, scheduling, and what support is included.</p>
            <p>Fees, availability, eligibility, and session arrangements have not been confirmed here. This prototype does not take payments, reserve places, or book appointments.</p>
            <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">Discuss the program and fit <span className="ml-2" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section id="faq" className="page-container py-12 sm:py-20">
        <p className="eyebrow">Before you begin</p><h2 className="section-heading mt-4">Useful things to know.</h2>
        <div className="mt-7 max-w-4xl">
          <details className="border-t border-border py-5"><summary className="min-h-11 cursor-pointer py-2 font-semibold">Do I need coding experience?</summary><p className="mt-3 max-w-3xl leading-relaxed text-muted">The current program is described as beginner-friendly and uses no-code tools. The right fit and tools for a particular idea would need to be discussed.</p></details>
          <details className="border-t border-border py-5"><summary className="min-h-11 cursor-pointer py-2 font-semibold">What does the eight-week outline cover?</summary><p className="mt-3 max-w-3xl leading-relaxed text-muted">The published outline moves through problem discovery, prototyping, a first version, and sharing for feedback. It is a proposed curriculum, not a guarantee that a product will launch.</p></details>
          <details className="border-t border-border py-5"><summary className="min-h-11 cursor-pointer py-2 font-semibold">What should parents or guardians confirm?</summary><p className="mt-3 max-w-3xl leading-relaxed text-muted">Ask about eligibility, safeguarding, session format, adult involvement, scheduling, and support between sessions. Those details are not confirmed on this prototype.</p></details>
          <details className="border-t border-border py-5"><summary className="min-h-11 cursor-pointer py-2 font-semibold">Where can I find fees and availability?</summary><p className="mt-3 max-w-3xl leading-relaxed text-muted">No confirmed fees or availability are published here. The prototype does not take payments or reserve a place, so please do not treat it as an offer or booking.</p></details>
          <details className="border-y border-border py-5"><summary className="min-h-11 cursor-pointer py-2 font-semibold">Can I request a consultation here?</summary><p className="mt-3 max-w-3xl leading-relaxed text-muted">You can submit a synthetic adult consultation request to try the workflow. This independent demo stores the request privately; it does not book appointments, send email, or contact the real Tactyqal team.</p></details>
        </div>
      </section>

      <LatestPosts />

      <section className="page-container pb-12 sm:pb-20">
        <div className="bg-[#245544] px-6 py-9 text-[#fffdf8] sm:px-10 sm:py-12">
          <p className="text-xs uppercase tracking-[0.16em] text-[#dce5d8]">A first conversation, when the details are ready</p>
          <div className="mt-4 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div className="w-full min-w-0"><h2 className="font-heading text-3xl leading-tight sm:text-4xl">Curiosity first.<br />The practical details next.</h2><p className="mt-4 max-w-2xl leading-relaxed text-[#e9eee8]">Talk through an idea and the support it might need. Try the request workflow using synthetic adult contact details only.</p></div>
            <Button variant="secondary" className="max-w-full whitespace-normal border-white text-white hover:bg-white/10" asChild><Link href="/contact">Request a consultation <span aria-hidden="true">→</span></Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
