import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// give native form controls a visible boundary and consistent validation treatment
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("min-h-11 w-full rounded-lg border border-control-border bg-white px-3 py-2 text-base aria-invalid:border-danger", className)} {...props} />;
}
