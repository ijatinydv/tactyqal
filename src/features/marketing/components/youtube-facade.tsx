"use client";

import { useState } from "react";
import { Play } from "lucide-react";

// lite click-to-load embed: avoids loading any YouTube iframe/script until the visitor opts in
export function YouTubeFacade({ title, embedUrl }: { title: string; embedUrl: string }) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        className="aspect-video w-full rounded-lg"
        src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-control-border bg-ink text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      aria-label={`Play video: ${title}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-ink transition-transform group-hover:scale-105">
        <Play size={20} fill="currentColor" aria-hidden="true" />
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs font-medium">{title}</span>
    </button>
  );
}
