import type { Metadata } from "next";
import Link from "next/link";

// describe this demo rather than borrowing a policy for an unrelated production service
export const metadata: Metadata = { title: "Demo privacy and data handling" };

// disclose the real stored fields access and retention before accepting adult consultation information
export default function PrivacyPage() {
  return <article className="page-container max-w-3xl py-14"><p className="eyebrow">Independent prototype · updated 10 November 2026</p><h1 className="section-heading mt-4">A small request.<br />Clear expectations.</h1><p className="mt-6 text-lg leading-relaxed text-muted">This is an independent hiring-challenge demonstration, not the official Tactyqal service. Please use synthetic contact information only.</p>
    <section className="mt-9 border-t border-border pt-6"><h2 className="font-heading text-3xl">What this demo stores</h2><p className="mt-4 leading-relaxed text-muted">A consultation request contains an adult contact name, email, relationship, optional message, acknowledgement, timestamps, and review status. Technical receipt/idempotency and rate-limit metadata help prevent duplicates and abuse. Do not provide a child’s name, age, school, or private details.</p></section>
    <section className="mt-9 border-t border-border pt-6"><h2 className="font-heading text-3xl">Who can see it</h2><p className="mt-4 leading-relaxed text-muted">Only authorised demo editors can read requests in the private inbox. Visitors receive a receipt, not access to stored requests. Supabase provides the database and invited-editor authentication; editor login uses session cookies. The form does not subscribe anyone to marketing or contact a calendar, email provider, or the real Tactyqal business.</p></section>
    <section className="mt-9 border-t border-border pt-6"><h2 className="font-heading text-3xl">How long it stays</h2><p className="mt-4 leading-relaxed text-muted">Demo requests remain until an authorised editor deletes them or the disposable demo database is reset. There is no promised automatic retention period. Editors can delete requests from the inbox; this site does not offer an automated public deletion or email-support service. Limited technical abuse/idempotency records may remain according to the database policy and do not grant public access to contacts.</p></section>
    <section className="mt-9 border-t border-border pt-6"><h2 className="font-heading text-3xl">Public editorial media</h2><p className="mt-4 leading-relaxed text-muted">Article cover images are public assets, even when their article is a draft. No confidential images should be uploaded. This demonstration does not claim privacy certification or replace a reviewed production privacy policy.</p></section>
    <Link href="/contact" className="mt-9 inline-block text-brand underline">Back to consultation requests →</Link>
  </article>;
}
