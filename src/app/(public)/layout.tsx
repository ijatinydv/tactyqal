import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// share one coherent public identity between the mentoring offer and its resources
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <><SiteHeader /><main id="main-content" className="min-h-[65vh]">{children}</main><SiteFooter /></>;
}
