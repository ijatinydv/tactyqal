"use client";

import { Button } from "@/components/ui/button";

// give unexpected page failures a safe retry path without exposing internal error details
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="page-container py-24"><h1 className="section-heading">Something interrupted this page.</h1><p className="my-6 text-muted">Please try again. Your request has not been confirmed.</p><Button onClick={reset}>Try again</Button></main>;
}
