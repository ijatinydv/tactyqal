// The real eight-week 1:1 mentoring program outline.
export const programStages = [
  { weeks: "01–02", title: "Ideation and market research", description: "Explore ideas, validate demand, and choose a problem worth building for." },
  { weeks: "03–04", title: "Design and prototyping", description: "Sketch the experience, build a clickable prototype, and refine it with feedback." },
  { weeks: "05–06", title: "Full-stack development (no-code)", description: "Build the real, working app using modern no-code tools — no coding experience needed." },
  { weeks: "07–08", title: "Launch and marketing", description: "Launch the app, tell its story, and start reaching real users." },
] as const;

export const programDetailLine =
  "Personal 1:1 live sessions, 1 hour each, with expert guidance. About 2-3 hours per week in total.";

export const heroStats = [
  { value: "50+", label: "students mentored" },
  { value: "8-week", label: "1:1 program" },
  { value: "6", label: "featured student apps" },
] as const;
