import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// keep the demo out of search engines unless an operator explicitly opts in via ALLOW_INDEXING
const allowIndexing = process.env.ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  title: { default: "Tactyqal Labs — Your teen's idea, a launched app in 8 weeks", template: "%s | Tactyqal Labs" },
  description: "1:1 mentoring that takes a young builder from idea to a working full-stack app in 8 weeks, using no-code tools.",
  robots: { index: allowIndexing, follow: allowIndexing },
};

// supply document landmarks and a keyboard shortcut shared by every application shell
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className="min-h-screen antialiased"><a href="#main-content" className="sr-only z-60 rounded-lg bg-white p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>{children}</body></html>;
}
