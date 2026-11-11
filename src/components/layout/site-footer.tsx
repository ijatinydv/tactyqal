import Link from "next/link";
import { contactInfo } from "@/content/contact-info";

// keep contact details, navigation, and editorial/API access all discoverable in one place
export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="page-container grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="wordmark">tactyqal</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">1:1 mentoring that takes a young builder from idea to a launched full-stack app.</p>
          <p className="mt-4 text-sm text-muted">
            <a href={`mailto:${contactInfo.email}`} className="hover:text-brand">{contactInfo.email}</a>
            <br />
            <a href={contactInfo.phoneHref} className="hover:text-brand">{contactInfo.phone}</a>
            <br />
            {contactInfo.hours}
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm text-muted">
          <Link href="/#program" className="hover:text-brand">Program</Link>
          <Link href="/projects" className="hover:text-brand">Stories</Link>
          <Link href="/#tools" className="hover:text-brand">Tools</Link>
          <Link href="/blog" className="hover:text-brand">Journal</Link>
          <Link href="/#pricing" className="hover:text-brand">Pricing</Link>
          <Link href="/#faq" className="hover:text-brand">FAQ</Link>
          <Link href="/privacy" className="hover:text-brand">Privacy</Link>
        </nav>
        <nav aria-label="Account and documentation" className="flex flex-col gap-2 text-sm text-muted">
          <Link href="/login" className="hover:text-brand">Editor login</Link>
          <Link href="/docs" className="hover:text-brand">API docs</Link>
          <Link href="/contact" className="hover:text-brand">Book a free consultation</Link>
        </nav>
      </div>
      <div className="page-container mt-8 border-t border-border pt-6">
        <p className="text-xs text-muted">Redesign concept by Jatin Kumar for the Tactyqal Labs hire-a-thon.</p>
      </div>
    </footer>
  );
}
