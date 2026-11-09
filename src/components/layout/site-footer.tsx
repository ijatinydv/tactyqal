import Link from "next/link";

// keep provenance and editorial access visible without implying an official business service
export function SiteFooter() {
  return <footer className="border-t border-border py-8"><div className="page-container flex flex-col justify-between gap-5 text-sm text-muted md:flex-row">
    <div><p className="font-medium text-ink">tactyqal / From an idea to something real.</p><p className="mt-2 max-w-md">Independent redesign prototype. Not an official Tactyqal service.</p></div>
    <nav aria-label="Footer" className="flex flex-wrap items-start gap-5"><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/login">Editor login</Link></nav>
  </div></footer>;
}
