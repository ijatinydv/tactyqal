import type { Metadata } from "next";

// identify the prototype's actual data handling rather than copying an unrelated privacy policy
export const metadata: Metadata = { title: "Prototype privacy" };

// document only the data behavior that exists at this implementation stage
export default function PrivacyPage() {
  return <article className="page-container max-w-3xl py-14"><p className="eyebrow">Independent prototype</p><h1 className="section-heading mt-4">Your information, handled honestly.</h1><p className="mt-6 leading-relaxed text-muted">This site is an independent hiring-challenge submission, not the official Tactyqal service. It currently accepts no consultation requests or marketing subscriptions. Editorial authentication, when configured, uses Supabase session cookies. Do not enter student details or confidential information into this demo.</p><p className="mt-4 leading-relaxed text-muted">The request flow and its retention/privacy notice will be defined before inquiry collection is enabled. This is not a promise of an unimplemented email, booking, or deletion service.</p></article>;
}
