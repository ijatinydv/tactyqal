import { testimonials } from "@/content/testimonials";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase();
}

export function TestimonialsGrid() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial) => (
        <li key={testimonial.name} className="flex flex-col rounded-xl border border-border bg-white p-5">
          <p className="leading-relaxed text-ink">&ldquo;{testimonial.quote}&rdquo;</p>
          <div className="mt-5 flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
              {initials(testimonial.name)}
            </span>
            <p className="text-sm font-semibold text-ink">{testimonial.name}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
