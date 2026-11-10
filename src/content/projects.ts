// explain each authored concept without presenting it as a real learner outcome
export type ProjectStory = {
  slug: string;
  title: string;
  label: string;
  summary: string;
  problem: string;
  approach: string[];
  learning: string[];
  visual: "library" | "market";
};

// keep source-authored project concepts distinct from verified student work
export const projectStories: ProjectStory[] = [
  {
    slug: "neighbourhood-library",
    title: "Neighbourhood Library",
    label: "A local book-sharing concept",
    summary: "What if the best next read was already just around the corner? This concept explores a simple way to make community book-sharing easier to picture.",
    problem: "A shared shelf can be easy to miss. Someone looking for a book may not know what is available, while a neighbour with a book to lend may not know how to offer it.",
    approach: [
      "Start with the small moment: finding a nearby book and understanding how to borrow it.",
      "Sketch a shelf page with a few sample titles, a clear location, and a simple request to connect.",
      "Keep the first version focused on browsing and expressing interest rather than building a full library system.",
    ],
    learning: [
      "Turn a broad community idea into one understandable task.",
      "Choose what a reader needs to know before taking action.",
      "Notice where privacy and neighbour-to-neighbour trust should shape a design.",
    ],
    visual: "library",
  },
  {
    slug: "market-day",
    title: "Market Day",
    label: "A neighbourhood market guide concept",
    summary: "A first-time visitor might want to know what is happening before setting out. This concept imagines a calm, useful guide to a local market day.",
    problem: "Market details can be scattered across signs and conversations. A visitor may simply want to know when to go, what kinds of stalls to expect, and how to find their way around.",
    approach: [
      "Focus on the visitor’s first questions: when, where, and what might be there.",
      "Arrange sample stall categories and a hand-drawn market map into one easy-to-scan guide.",
      "Treat opening times and stall listings as details that would need local confirmation before publication.",
    ],
    learning: [
      "Organise information around the questions people actually bring.",
      "Use a simple map and categories to make a place easier to navigate.",
      "Separate useful example content from details that need verification.",
    ],
    visual: "market",
  },
];
