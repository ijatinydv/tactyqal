import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// describe the independent submission without borrowing unverified commercial claims
export const metadata: Metadata = {
  title: { default: "Tactyqal — The Builder’s Studio", template: "%s | Tactyqal" },
  description: "An independent redesign exploring personalised mentoring, useful projects, and practical resources for young builders.",
  robots: { index: false, follow: false },
};

// supply document landmarks and a keyboard shortcut shared by every application shell
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className="min-h-screen antialiased"><a href="#main-content" className="sr-only z-60 rounded-lg bg-white p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>{children}</body></html>;
}
