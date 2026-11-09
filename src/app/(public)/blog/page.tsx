import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";

// describe the resource destination before published database content is connected
export const metadata: Metadata = { title: "Journal" };

// make unfinished integration explicit instead of displaying fabricated published articles
export default function JournalPage() {
  return <section className="page-container py-14"><p className="eyebrow">Notes for the next step</p><h1 className="section-heading mt-4">Ideas, tested in the real world.</h1><p className="my-6 max-w-xl leading-relaxed text-muted">Practical resources about finding a problem, building a first version, and learning from what happens next.</p><Alert>The public Journal will connect to published database content in Chunk 08. No article feed is implemented yet.</Alert></section>;
}
