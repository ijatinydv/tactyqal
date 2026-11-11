import { UserCheck, Layers, TrendingUp, GraduationCap, IndianRupee, Heart, Mic, Lightbulb, type LucideIcon } from "lucide-react";
import { whyCards } from "@/content/why-tactyqal";
import { YouTubeFacade } from "./youtube-facade";

const icons: Record<string, LucideIcon> = { UserCheck, Layers, TrendingUp, GraduationCap, IndianRupee, Heart, Mic, Lightbulb };

export function WhyGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {whyCards.map((card) => {
        const Icon = icons[card.icon];
        return (
          <div key={card.title} className="flex flex-col rounded-xl border border-border bg-white p-5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-surface-muted text-brand">
              <Icon size={20} aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-semibold text-ink">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{card.description}</p>
            {card.video ? (
              <div className="mt-4">
                <YouTubeFacade title={card.video.title} embedUrl={card.video.embedUrl} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
