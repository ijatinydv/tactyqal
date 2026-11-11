import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LatestPosts } from "@/features/marketing/components/latest-posts";
import { HeroVideo } from "@/features/marketing/components/hero-video";
import { StudentAppCard } from "@/features/marketing/components/student-app-card";
import { ProgramTimeline } from "@/features/marketing/components/program-timeline";
import { WhyGrid } from "@/features/marketing/components/why-grid";
import { ToolsGrid } from "@/features/marketing/components/tools-grid";
import { TestimonialsGrid } from "@/features/marketing/components/testimonials-grid";
import { PricingCard } from "@/features/marketing/components/pricing-card";
import { FaqAccordion } from "@/features/marketing/components/faq-accordion";
import { Reveal } from "@/features/marketing/components/reveal";
import { studentApps } from "@/content/students";
import { heroStats } from "@/content/program";
import { contactInfo } from "@/content/contact-info";

// keep the latest published journal entries current without rebuilding the homepage
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="page-container grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-24">
        <div className="max-w-xl">
          <p className="eyebrow">Tactyqal Labs · 1:1 mentoring for young builders</p>
          <h1 className="display-heading mt-5">Your teen&rsquo;s idea, a launched app in 8 weeks.</h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">1:1 mentoring that takes a young builder from idea to a working full-stack app, using no-code tools. No coding experience needed.</p>
          <div className="mt-7 flex flex-col items-stretch gap-3 min-[440px]:flex-row min-[440px]:items-center">
            <Button asChild><Link href="/contact">Book a free consultation</Link></Button>
            <Button variant="secondary" asChild><Link href="#stories">See student apps</Link></Button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-heading text-2xl text-brand sm:text-3xl">{stat.value}</dd>
                <p className="mt-1 text-xs leading-snug text-muted">{stat.label}</p>
              </div>
            ))}
          </dl>
        </div>
        <HeroVideo />
      </section>

      {/* STUDENT APPS */}
      <section id="stories" className="border-y border-border bg-[#f4f2ec] py-14 sm:py-20">
        <div className="page-container">
          <Reveal>
            <p className="eyebrow">Stories</p>
            <h2 className="section-heading mt-4">Real students. Real apps.</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studentApps.map((app, index) => (
              <Reveal key={app.slug} delayMs={index * 60}>
                <Link href={`/projects/${app.slug}`} className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                  <StudentAppCard app={app} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* THE 8-WEEK JOURNEY */}
      <section id="program" className="page-container py-14 sm:py-20">
        <Reveal>
          <p className="eyebrow">The program</p>
          <h2 className="section-heading mt-4">From idea to full app in 8 weeks.</h2>
        </Reveal>
        <div className="mt-10">
          <ProgramTimeline />
        </div>
      </section>

      {/* WHY PARENTS CHOOSE TACTYQAL LABS */}
      <section className="border-y border-border bg-[#f4f2ec] py-14 sm:py-20">
        <div className="page-container">
          <Reveal>
            <p className="eyebrow">Why parents choose Tactyqal Labs</p>
            <h2 className="section-heading mt-4">A mentoring program built around real outcomes.</h2>
          </Reveal>
          <div className="mt-10">
            <WhyGrid />
          </div>
        </div>
      </section>

      {/* FREE TOOLS */}
      <section id="tools" className="page-container py-14 sm:py-20">
        <Reveal>
          <p className="eyebrow">Free tools to get started</p>
          <h2 className="section-heading mt-4">Startup assessment tools used by 1000+ entrepreneurs.</h2>
        </Reveal>
        <div className="mt-10">
          <ToolsGrid />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-y border-border bg-[#f4f2ec] py-14 sm:py-20">
        <div className="page-container">
          <Reveal>
            <p className="eyebrow">Testimonials</p>
            <h2 className="section-heading mt-4">What our students say.</h2>
          </Reveal>
          <div className="mt-10">
            <TestimonialsGrid />
          </div>
        </div>
      </section>

      {/* JOURNAL PREVIEW */}
      <LatestPosts />

      {/* PRICING */}
      <section id="pricing" className="page-container py-14 sm:py-20">
        <Reveal className="text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="section-heading mt-4">One program. One clear price.</h2>
        </Reveal>
        <div className="mt-10">
          <PricingCard />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border page-container py-14 sm:py-20">
        <p className="eyebrow">FAQ</p>
        <h2 className="section-heading mt-4">Questions parents ask us.</h2>
        <div className="mt-8">
          <FaqAccordion />
        </div>
      </section>

      {/* CONTACT CTA BAND */}
      <section className="page-container pb-14 sm:pb-20">
        <div className="bg-[#245544] px-6 py-10 text-[#fffdf8] sm:px-10 sm:py-14">
          <p className="text-xs uppercase tracking-[0.16em] text-[#dce5d8]">Let&rsquo;s talk about your teen&rsquo;s idea</p>
          <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="w-full min-w-0">
              <h2 className="font-heading text-3xl leading-tight sm:text-4xl">Book a free consultation today.</h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-[#e9eee8]">
                {contactInfo.email} · {contactInfo.phone} · {contactInfo.hours}. {contactInfo.responseTime}
              </p>
            </div>
            <div className="flex flex-col gap-3 min-[440px]:flex-row">
              <Button variant="secondary" className="max-w-full whitespace-normal border-white text-white hover:bg-white/10" asChild>
                <Link href="/contact">Book a free consultation <span aria-hidden="true">→</span></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
