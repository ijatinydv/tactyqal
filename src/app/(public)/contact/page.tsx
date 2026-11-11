import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "@/features/consultations/components/request-form";
import { contactInfo } from "@/content/contact-info";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Book a free consultation", description: "Talk to us about your teen's idea and how the 8-week mentoring program works." };

export default function ContactPage() {
  return (
    <section className="page-container grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1fr] lg:gap-20">
      <div>
        <p className="eyebrow">Book a free consultation</p>
        <h1 className="display-heading mt-5">Let&rsquo;s talk about what your teen wants to build.</h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
          An idea, a question, or an unfinished sketch is a good place to begin. We&rsquo;ll walk you through the program and how it fits your teen.
        </p>
        <div className="mt-8">
          <Button variant="secondary" asChild>
            <Link href={contactInfo.bookingUrl} target="_blank" rel="noopener noreferrer">
              Or pick a time directly <span aria-hidden="true">↗</span>
            </Link>
          </Button>
        </div>
        <div className="mt-9 border-y border-border py-6">
          <h2 className="font-heading text-2xl">Contact details</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
            <li><a href={`mailto:${contactInfo.email}`} className="text-brand underline">{contactInfo.email}</a></li>
            <li><a href={contactInfo.phoneHref} className="text-brand underline">{contactInfo.phone}</a></li>
            <li>{contactInfo.hours}</li>
            <li>{contactInfo.responseTime}</li>
          </ul>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          A parent, guardian, or adult participant should fill in the form with their own contact details. We only collect what we need to follow up.
        </p>
        <Link href="/privacy" className="mt-5 inline-block text-sm text-brand underline">How we handle your information →</Link>
      </div>
      <RequestForm />
    </section>
  );
}
