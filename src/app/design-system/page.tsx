import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

// keep a development only reference for approved component variants and accessible states
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main id="main-content" className="page-container space-y-8 py-12"><h1 className="section-heading">The Builder’s Studio / UI foundations</h1><p>Development-only component specimens. These controls submit no data.</p><div className="flex flex-wrap gap-4"><Button>Primary specimen</Button><Button variant="secondary">Secondary specimen</Button><Button disabled>Disabled specimen</Button><Button variant="destructive">Destructive specimen</Button></div><div className="max-w-lg"><label htmlFor="specimen" className="mb-2 block">Example email</label><Input id="specimen" type="email" autoComplete="email" placeholder="you@example.com" /></div><Alert>Informational status specimen.</Alert><Alert tone="error">Validation error specimen.</Alert></main>;
}
