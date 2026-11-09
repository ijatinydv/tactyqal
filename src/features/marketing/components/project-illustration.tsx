// show an original product possibility without presenting it as a verified student result
export function ProjectIllustration() {
  return <figure className="rounded-xl bg-surface-muted p-5 sm:p-8">
    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted"><span>01 / Neighbourhood Library</span><span>Concept project</span></div>
    <div className="mt-6 rounded-lg border border-border bg-canvas p-5 sm:p-7">
      <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-4 text-xs"><strong>Neighbourhood Library</strong><span>Borrow locally</span></div>
      <p className="mt-6 font-heading text-4xl leading-none tracking-tight sm:text-5xl">Good books.<br />Closer to home.</p>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">An idea for sharing the stories already sitting on your neighbours’ shelves.</p>
      <div aria-hidden="true" className="mt-6 grid grid-cols-3 items-end gap-3 font-heading text-lg leading-tight sm:text-xl"><div className="min-h-32 border-l-4 border-[#bea273] bg-[#d7bb8c] p-2 sm:p-3">The<br />little<br />things.</div><div className="min-h-40 border-l-4 border-[#294638] bg-[#345a48] p-2 text-white sm:p-3">A field<br />guide.</div><div className="min-h-28 border-l-4 border-[#babfaf] bg-[#dbdcd1] p-2 sm:p-3">Some<br />where<br />new.</div></div>
    </div>
    <figcaption className="mt-5 text-xs leading-relaxed text-muted">Idea → Prototype → Launch<br />Original illustration. Not a Tactyqal student outcome.</figcaption>
  </figure>;
}
