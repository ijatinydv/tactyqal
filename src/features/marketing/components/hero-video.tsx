"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const VIDEO_SRC = "https://www.tactyqal.com/application/assets/videos/kid_impact.mp4";

// click-to-play hero video: no autoplay, no network cost until the visitor opts in
export function HeroVideo() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <video
        className="aspect-video w-full rounded-xl bg-black"
        controls
        autoPlay
        playsInline
        preload="none"
        src={VIDEO_SRC}
      >
        Your browser does not support embedded video.
      </video>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-[#245544] to-[#1b4235] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      aria-label="Play video: student app impact"
    >
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-brand shadow-lg transition-transform group-hover:scale-105 sm:size-20">
          <Play size={28} fill="currentColor" aria-hidden="true" />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-sm font-medium text-white">
        Watch: the impact of a student-built app
      </span>
    </button>
  );
}
