// Real student-built apps from the Tactyqal mentoring program.
// Only facts supplied by the client are included here — no invented metrics or names.
export type StudentApp = {
  slug: string;
  name: string;
  description: string;
  startedBy?: string;
  image: string;
};

export const studentApps: StudentApp[] = [
  {
    slug: "krishidrishti",
    name: "KrishiDrishti",
    description:
      "AI-powered soil analysis and crop recommendation app that can impact millions of local farmers in India.",
    image: "https://www.tactyqal.com/application/assets/img/apps/krishidrishti1.png",
  },
  {
    slug: "elenor-vegan-handbags",
    name: "Elenor Vegan Handbags",
    description:
      "Corporate gifting platform selling vegan handbags, generating INR 9,000 in its first week.",
    startedBy: "Started by a 16-year-old",
    image: "https://www.tactyqal.com/application/assets/img/apps/elenor1.png",
  },
  {
    slug: "one-last-chapter",
    name: "One Last Chapter",
    description:
      "Book subscription service for kids, generating INR 100,000 per month in revenue.",
    startedBy: "Started by a 13-year-old",
    image: "https://www.tactyqal.com/application/assets/img/apps/olc1.png",
  },
  {
    slug: "paws-of-promise",
    name: "Paws of Promise",
    description: "App for virtual pet adoption that connects pet lovers with pets from shelters.",
    image: "https://www.tactyqal.com/application/assets/img/apps/pop1.png",
  },
  {
    slug: "audionova",
    name: "AudioNova",
    description: "AI music and video production company.",
    image: "https://www.tactyqal.com/application/assets/img/apps/audionova1.png",
  },
  {
    slug: "converza",
    name: "Converza",
    description: "Spanish language learning app featuring Luna, the friendly AI language learning bot.",
    image: "https://www.tactyqal.com/application/assets/img/apps/converza1.png",
  },
];
