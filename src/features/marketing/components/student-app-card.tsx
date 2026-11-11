"use client";

import Image from "next/image";
import { useState } from "react";
import type { StudentApp } from "@/content/students";

// show a real student app screenshot with a graceful fallback if the remote image fails to load
export function StudentAppCard({ app }: { app: StudentApp }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="group overflow-hidden rounded-xl border border-border bg-white">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {failed ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e9eee8] to-[#dce5d8] text-center">
            <p className="px-4 text-sm font-medium text-muted">{app.name}</p>
          </div>
        ) : (
          <Image
            src={app.image}
            alt={`Screenshot of the ${app.name} app`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
            loading="lazy"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption className="p-5">
        <h3 className="font-heading text-xl text-ink">{app.name}</h3>
        {app.startedBy ? <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand">{app.startedBy}</p> : null}
        <p className="mt-2 text-sm leading-relaxed text-muted">{app.description}</p>
      </figcaption>
    </figure>
  );
}
