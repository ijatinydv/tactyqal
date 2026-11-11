"use client";

import { useState } from "react";
import { programStages, programDetailLine } from "@/content/program";

// a keyboard-accessible vertical stepper: arrow keys move focus, each step is a real tab stop
export function ProgramTimeline() {
  const [active, setActive] = useState(0);

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      const next = (index + 1) % programStages.length;
      setActive(next);
      document.getElementById(`stage-tab-${next}`)?.focus();
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      const prev = (index - 1 + programStages.length) % programStages.length;
      setActive(prev);
      document.getElementById(`stage-tab-${prev}`)?.focus();
    }
  }

  return (
    <div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="tablist" aria-label="The eight-week program">
        {programStages.map((stage, index) => (
          <li key={stage.weeks}>
            <button
              id={`stage-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-controls={`stage-panel-${index}`}
              tabIndex={active === index ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`min-h-11 w-full rounded-xl border p-4 text-left transition-colors ${active === index ? "border-brand bg-surface-muted" : "border-border bg-white hover:border-control-border"}`}
            >
              <p className="font-heading text-2xl text-brand">0{index + 1}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted">Weeks {stage.weeks}</p>
              <p className="mt-1 font-semibold text-ink">{stage.title}</p>
            </button>
          </li>
        ))}
      </ol>
      {programStages.map((stage, index) => (
        <div
          key={stage.weeks}
          id={`stage-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`stage-tab-${index}`}
          hidden={active !== index}
          className="mt-6 max-w-2xl rounded-xl border border-border bg-white p-6"
        >
          <p className="eyebrow">Weeks {stage.weeks}</p>
          <h3 className="mt-2 font-heading text-2xl text-ink">{stage.title}</h3>
          <p className="mt-3 leading-relaxed text-muted">{stage.description}</p>
        </div>
      ))}
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">{programDetailLine}</p>
    </div>
  );
}
