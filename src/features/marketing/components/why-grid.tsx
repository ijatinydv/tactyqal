import { UserCheck, Layers, TrendingUp, GraduationCap, IndianRupee, Heart, Mic, Lightbulb, type LucideIcon } from "lucide-react";
import { whyCards } from "@/content/why-tactyqal";
import { YouTubeFacade } from "./youtube-facade";

const icons: Record<string, LucideIcon> = { UserCheck, Layers, TrendingUp, GraduationCap, IndianRupee, Heart, Mic, Lightbulb };

export function WhyGrid() {
  // keep the video card out of the grid: a taller cell forces the grid to stretch its
  // row-mates to match, leaving empty space under their shorter text content
  const cards = whyCards.filter((card) => !card.video);
  const videoCard = whyCards.find((card) => card.video);

  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = icons[card.icon];
          return (
            <div key={card.title} className="flex flex-col rounded-xl border border-border bg-white p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-surface-muted text-brand">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{card.description}</p>
            </div>
          );
        })}
      </div>

      {videoCard && videoCard.video && (
        <div className="grid gap-6 rounded-xl border border-border bg-white p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center">
          <div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-surface-muted text-brand">
              {(() => {
                const Icon = icons[videoCard.icon];
                return <Icon size={20} aria-hidden="true" />;
              })()}
            </span>
            <h3 className="mt-4 font-semibold text-ink">{videoCard.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{videoCard.description}</p>
          </div>
          <YouTubeFacade title={videoCard.video.title} embedUrl={videoCard.video.embedUrl} />
        </div>
      )}
    </div>
  );
}
