import type { Metadata } from "next";
import Link from "next/link";
import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { LoginForm } from "@/features/auth/components/login-form";
import type { LoginActionState } from "@/features/auth/types";
import { getPublicSupabaseConfig } from "@/lib/env/public";

// keep private editor entry pages out of search results
export const metadata: Metadata = {
  title: "Editor sign in",
  robots: { index: false, follow: false },
};

// ensure auth status is evaluated from current configuration on every page request
export const dynamic = "force-dynamic";

// prevent stale login notices or configuration from being reused across requests
export const revalidate = 0;

// provide invited editors a truthful sign-in page with safe configuration and error states
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string | string[] }> }) {
  const config = getPublicSupabaseConfig();
  const { reason } = await searchParams;
  const currentReason = Array.isArray(reason) ? reason[0] : reason;
  let notice: LoginActionState | null = null;

  if (currentReason === "sessionexpired") {
    notice = { email: "", message: "Your editor session has expired. Please sign in again.", messageKind: "notice", fieldErrors: {} };
  } else if (currentReason === "denied") {
    notice = { email: "", message: "This account is not authorized to access the editor workspace.", messageKind: "error", fieldErrors: {} };
  } else if (currentReason === "signedout") {
    notice = { email: "", message: "You have been signed out.", messageKind: "notice", fieldErrors: {} };
  } else if (currentReason === "signoutfailed") {
    notice = { email: "", message: "The current session could not be confirmed as signed out. Please try again.", messageKind: "error", fieldErrors: {} };
  }

  return (
    <main id="main-content" className="page-container max-w-xl py-16 sm:py-20">
      <Link href="/" className="wordmark">tactyqal</Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.12em] text-brand">Editor workspace</p>
      <h1 className="section-heading mt-3">A space for the editorial team.</h1>
      <p className="mt-4 max-w-prose text-base leading-7 text-muted">
        Sign in with the email address attached to your editor invitation. Public account creation and password recovery are not available here.
      </p>
      {config ? <LoginForm notice={notice} /> : <ConfigurationNotice />}
      <Link href="/" className="mt-8 inline-block text-sm text-brand underline">Return to the site</Link>
    </main>
  );
}
