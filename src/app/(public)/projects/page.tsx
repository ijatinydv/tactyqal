import type { Metadata } from "next";
import { ProjectIllustration } from "@/features/marketing/components/project-illustration";

// orient project browsing without manufacturing real student achievements
export const metadata: Metadata = { title: "Project possibilities" };

// give the foundation navigation an honest useful destination before full project storytelling
export default function ProjectsPage() {
  return <section className="page-container grid gap-10 py-12 lg:grid-cols-2"><div><p className="eyebrow">Illustrative concepts</p><h1 className="section-heading mt-4">Small beginnings.<br />Real possibilities.</h1><p className="mt-6 max-w-md leading-relaxed text-muted">Neighbourhood Library explores sharing books locally. It is an original example of a focused first project, not a verified Tactyqal student achievement.</p><p className="mt-4 text-sm text-muted">Detailed project stories arrive in Chunk 09.</p></div><ProjectIllustration /></section>;
}
