"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// keep the primary public destinations consistent across desktop and mobile navigation
const links = [{ label: "Program", href: "/#program" }, { label: "Projects", href: "/projects" }, { label: "Journal", href: "/blog" }, { label: "FAQ", href: "/#faq" }];

// provide keyboard accessible mobile navigation without crowding the first screen
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="border-b border-border">
    <div className="page-container flex min-h-19 items-center justify-between gap-4">
      <Link href="/" className="wordmark" aria-label="Tactyqal Labs home">tactyqal<span className="ml-2 font-sans text-xs tracking-normal text-muted">Labs</span></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
        {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className="text-sm font-medium text-ink hover:text-brand">{link.label}</Link>)}
        <Button asChild><Link href="/contact">Request a consultation</Link></Button>
      </nav>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild><Button variant="secondary" className="lg:hidden" aria-label="Open navigation"><Menu size={18} />Menu</Button></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
          <Dialog.Content className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col gap-6 bg-canvas p-6 shadow-xl">
            <div className="flex items-center justify-between"><Dialog.Title className="font-heading text-3xl">Explore Tactyqal</Dialog.Title><Dialog.Close asChild><Button variant="ghost" aria-label="Close navigation"><X size={22} /></Button></Dialog.Close></div>
            <Dialog.Description className="text-sm text-muted">Program, project stories, and useful resources.</Dialog.Description>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-2">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-3 text-lg">{link.label}</Link>)}</nav>
            <Button asChild><Link href="/contact" onClick={() => setOpen(false)}>Request a consultation</Link></Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  </header>;
}
