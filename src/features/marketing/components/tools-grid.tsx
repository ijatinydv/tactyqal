import { Wrench } from "lucide-react";
import Link from "next/link";
import { freeTools, toolsExternalUrl } from "@/content/tools";
import { Button } from "@/components/ui/button";

export function ToolsGrid() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {freeTools.map((tool) => (
          <div key={tool} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-brand">
              <Wrench size={16} aria-hidden="true" />
            </span>
            <p className="text-sm font-medium leading-snug text-ink">{tool}</p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Button asChild>
          <Link href={toolsExternalUrl} target="_blank" rel="noopener noreferrer">
            Access all tools free <span aria-hidden="true">↗</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
