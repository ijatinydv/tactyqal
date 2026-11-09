import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// keep navigation and mutation actions visually consistent without changing their native semantics
const buttonVariants = cva("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: {
    primary: "bg-brand text-white hover:bg-brand-hover",
    secondary: "border border-control-border bg-transparent text-brand hover:bg-surface-muted",
    ghost: "text-brand underline-offset-4 hover:underline",
    destructive: "bg-danger text-white hover:opacity-90",
  } }, defaultVariants: { variant: "primary" },
});

// preserve accessible button behavior while supporting links through the same visual primitive
export function Button({ className, variant, asChild = false, ...props }: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, className }))} {...props} />;
}
