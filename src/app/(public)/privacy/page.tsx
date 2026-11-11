import type { Metadata } from "next";
import Link from "next/link";
import { contactInfo } from "@/content/contact-info";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="page-container max-w-3xl py-14">
      <p className="eyebrow">Updated 11 November 2026</p>
      <h1 className="section-heading mt-4">Privacy &amp; data handling</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted">
        This page explains what information we collect through the consultation form, how it&rsquo;s used, and who can access it.
      </p>
      <section className="mt-9 border-t border-border pt-6">
        <h2 className="font-heading text-3xl">What we collect</h2>
        <p className="mt-4 leading-relaxed text-muted">
          A consultation request includes the adult contact&rsquo;s name, email, relationship to the student, and an optional message. We do not ask for a child&rsquo;s name, age, school, or other personal details through this form.
        </p>
      </section>
      <section className="mt-9 border-t border-border pt-6">
        <h2 className="font-heading text-3xl">Who can see it</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Requests are stored securely and are only visible to authorised Tactyqal team members for the purpose of following up with you. We don&rsquo;t sell or share your information with third parties.
        </p>
      </section>
      <section className="mt-9 border-t border-border pt-6">
        <h2 className="font-heading text-3xl">How long we keep it</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Requests are kept for as long as needed to respond to your enquiry, and can be deleted by our team on request.
        </p>
      </section>
      <section className="mt-9 border-t border-border pt-6">
        <h2 className="font-heading text-3xl">Questions</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Reach out any time at <a href={`mailto:${contactInfo.email}`} className="text-brand underline">{contactInfo.email}</a> or {contactInfo.phone}.
        </p>
      </section>
      <Link href="/contact" className="mt-9 inline-block text-brand underline">Back to consultation requests →</Link>
    </article>
  );
}
