import type { ReactNode } from "react";

// keep status feedback readable even when a user cannot perceive its colour
export function Alert({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "success" }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border p-4 text-sm ${tone === "error" ? "border-danger text-danger" : "border-control-border bg-surface-muted text-ink"}`}>{children}</div>;
}
