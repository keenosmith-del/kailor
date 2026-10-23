export type CapabilityDetailContent = {
  title: string;
  label: string;
  detail: string;
};
export const capabilities = [
  {
    id: "discovery",
    title: "Discovery",
    label: "Understanding the situation",
    detail:
      "Guided questions and conversation gather circumstances, goals and existing tools. Confirmed context and open questions remain distinct, giving the assessment a grounded starting point.",
  },
  {
    id: "analysis",
    title: "Analysis",
    label: "Reasoning that can be reviewed",
    detail:
      "Structured assessments organise findings, options, constraints and questions that still need attention. Saved report history and PDF exports let that reasoning be revisited and shared.",
  },
  {
    id: "canvas",
    title: "Solution Canvas",
    label: "Consider the possibilities",
    detail:
      "The Canvas turns supported recommendations into approachable solution tiles. Details, refinements and selections help customers decide what to discuss with a consultant before scope is agreed.",
  },
  {
    id: "workspace",
    title: "Project workspaces",
    label: "Keep the context together",
    detail:
      "Each project keeps its own conversations, sources, discoveries and report history. Consultancy requests connect selected solutions with the relevant project context for review.",
  },
] as const satisfies readonly (CapabilityDetailContent & { id: string })[];
