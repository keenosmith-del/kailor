export type CapabilityDetailContent = {
  title: string;
  label: string;
  detail: string;
};
export const capabilities = [
  {
    id: "discovery",
    title: "Start wherever you are.",
    label: "Understanding the situation",
    detail:
      "Have an idea, an existing business challenge or something you need built? You don't need to arrive with all the answers.",
  },
  {
    id: "analysis",
    title: "Explore what's possible.",
    label: "Reasoning that can be reviewed",
    detail:
      "Discover software, automation and technology solutions recommended around your particular needs, budget and circumstances.",
  },
  {
    id: "canvas",
    title: "Choose what works for you.",
    label: "Consider the possibilities",
    detail:
      "Compare your options, explore the considerations and decide which solutions you'd like to pursue.",
  },
  {
    id: "workspace",
    title: "Watch it come together.",
    label: "Keep the context together",
    detail:
      "Work with a consultant to bring your chosen solutions to life, with clear progress, decisions and updates along the way.",
  },
] as const satisfies readonly (CapabilityDetailContent & { id: string })[];
