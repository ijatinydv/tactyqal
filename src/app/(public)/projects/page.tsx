import type { Metadata } from "next";
import Link from "next/link";
import { StudentAppCard } from "@/features/marketing/components/student-app-card";
import { studentApps } from "@/content/students";

export const metadata: Metadata = {
  title: "Student apps",
  description: "Real apps built by students in the Tactyqal Labs 1:1 mentoring program.",
};

export default function ProjectsPage() {
  return (
    <section className="page-container py-12 sm:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">Student apps</p>
        <h1 className="display-heading mt-5">Real students. Real apps.</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          A selection of full-stack apps built by students during the 8-week Tactyqal Labs mentoring program.
        </p>
      </header>
      <div className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {studentApps.map((app) => (
          <Link key={app.slug} href={`/projects/${app.slug}`} className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <StudentAppCard app={app} />
          </Link>
        ))}
      </div>
    </section>
  );
}
