import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "@/features/consultations/components/request-form";

// explain the actual request destination without implying a real business booking service
export const metadata: Metadata = { title: "Request a conversation", description: "Explore an idea and try the private consultation request workflow using synthetic adult details." };

// pair the working form with clear adult contact privacy and independent demo expectations
export default function ContactPage() {
  return <section className="page-container grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1fr] lg:gap-20">
    <div><p className="eyebrow">A conversation, not a commitment</p><h1 className="display-heading mt-5">Let’s talk about what you want to build.</h1><p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">An idea, a question, or an unfinished sketch is a good place to begin. The next step is understanding the problem and what support might help.</p>
      <div className="mt-9 border-y border-border py-6"><h2 className="font-heading text-2xl">Before you send a note</h2><ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted"><li>A parent, guardian, or adult participant should provide their own contact details.</li><li>No fees, eligibility, place, or mentoring arrangement are confirmed by this form.</li><li>Use synthetic details for evaluation. Do not enter a child’s personal information.</li></ul></div>
      <p className="mt-6 text-sm leading-relaxed text-muted"><strong className="text-ink">Independent demo:</strong> requests stay in this prototype’s private inbox. They do not reach the real Tactyqal team. No appointment is booked and no email is sent.</p><Link href="/privacy" className="mt-5 inline-block text-sm text-brand underline">How this demo handles requests →</Link>
    </div><RequestForm />
  </section>;
}
