import Link from "next/link";
import { Button } from "@/components/ui/button";

// help visitors recover from a missing destination without leaking private resource details
export default function NotFound() {
  return <main id="main-content" className="page-container py-24"><p className="eyebrow">Page not found</p><h1 className="section-heading mt-4">Nothing to see here. Yet.</h1><p className="my-6 text-muted">This page is missing or is not publicly available.</p><Button asChild><Link href="/">Return home</Link></Button></main>;
}
