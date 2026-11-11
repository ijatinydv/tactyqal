import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricing } from "@/content/pricing";

export function PricingCard() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-brand bg-white p-6 shadow-sm sm:p-10">
      <p className="eyebrow">{pricing.offerLabel}</p>
      <h3 className="mt-3 font-heading text-2xl text-ink sm:text-3xl">{pricing.title}</h3>
      <div className="mt-5 flex items-baseline gap-3">
        <span className="text-lg text-muted line-through">{pricing.originalPrice}</span>
        <span className="font-heading text-4xl text-brand">{pricing.offerPrice}</span>
      </div>
      <ul className="mt-6 space-y-3">
        {pricing.includes.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
            <Check size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <Button asChild className="mt-8 w-full">
        <Link href="/contact">Enroll now</Link>
      </Button>
      <p className="mt-4 text-sm font-medium text-ink">{pricing.guarantee}</p>
      <p className="mt-1 text-xs text-muted">{pricing.scarcity}</p>
    </div>
  );
}
