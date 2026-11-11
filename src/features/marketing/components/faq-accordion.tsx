import { faqItems } from "@/content/faq";

// native <details>/<summary> is fully keyboard accessible and needs no extra JS or dependency
export function FaqAccordion() {
  return (
    <div className="max-w-4xl">
      {faqItems.map((item) => (
        <details key={item.question} className="border-t border-border py-5 last:border-b">
          <summary className="min-h-11 cursor-pointer list-none py-2 pr-8 font-semibold text-ink marker:content-none">
            {item.question}
          </summary>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
