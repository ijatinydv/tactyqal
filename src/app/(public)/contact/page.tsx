import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";

// set accurate expectations for the independent prototype's consultation destination
export const metadata: Metadata = { title: "Consultation request" };

// prevent a static form from masquerading as a stored or booked consultation
export default function ContactPage() {
  return <section className="page-container py-14"><p className="eyebrow">A conversation, not a commitment</p><h1 className="section-heading mt-4 max-w-2xl">Let’s talk about what you want to build.</h1><p className="my-6 max-w-xl leading-relaxed text-muted">Discuss the idea, the support you need, and whether the program fits. This is an independent redesign, not an official booking service.</p><Alert>Consultation requests are implemented in Chunk 10. This page does not collect details, send emails, or book real appointments.</Alert></section>;
}
