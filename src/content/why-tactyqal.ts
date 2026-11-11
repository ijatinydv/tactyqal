// "Why parents choose Tactyqal Labs" — real program benefits, no invented claims.
export type WhyCard = {
  title: string;
  description: string;
  icon: "UserCheck" | "Layers" | "TrendingUp" | "GraduationCap" | "IndianRupee" | "Heart" | "Mic" | "Lightbulb";
  video?: { title: string; embedUrl: string };
};

export const whyCards: WhyCard[] = [
  { title: "1:1 Personalized Mentoring", description: "Dedicated expert guidance — no group classes.", icon: "UserCheck" },
  { title: "Full Stack App with No-Code", description: "Real, working apps built with modern no-code tools.", icon: "Layers" },
  { title: "Proven Track Record", description: "Real student apps and real revenue.", icon: "TrendingUp" },
  { title: "University Admission Edge", description: "Real-world projects that strengthen university applications.", icon: "GraduationCap" },
  { title: "Revenue Generation", description: "Learn to build, launch, and monetize a real product.", icon: "IndianRupee" },
  { title: "Life Long Support", description: "Guidance from ideation through launch and beyond.", icon: "Heart" },
  { title: "Pitch and Presentation Skills", description: "Learn to pitch and launch on Product Hunt.", icon: "Mic" },
  {
    title: "Startup Ideas 101",
    description: "Learn to find and validate startup ideas from the founder.",
    icon: "Lightbulb",
    video: { title: "Startup Ideas 101 with the founder", embedUrl: "https://www.youtube-nocookie.com/embed/UyUH06CfLbk?start=105" },
  },
];
