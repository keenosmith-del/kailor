export type TimelineDetailContent = {
  title: string;
  label: string;
  detail: string;
};
export type Milestone = TimelineDetailContent & {
  id: string;
  date: string;
  description: string;
  icon:
    | "code"
    | "foundation"
    | "understanding"
    | "discovery"
    | "canvas"
    | "workspace"
    | "website"
    | "present";
};
// Founding year and pre-company experience are owner-provided facts. The 2026
// capabilities are checked against implementation records and current source.
// See docs/iterations/021-company-timeline.md for the evidence map.
export const milestones: readonly Milestone[] = [
  {
    id: "foundations",
    date: "Before 2025",
    title: "Engineering foundations",
    icon: "code",
    label: "The experience behind the company",
    description:
      "Software, cloud systems, automation and intelligent applications form the technical foundation.",
    detail:
      "The engineering experience behind kailor predates the company. Work across software development, application architecture, cloud systems, automation and artificial intelligence informs the way problems are understood and solutions are designed today.",
  },
  {
    id: "founded",
    date: "2025",
    title: "kailor is founded",
    icon: "foundation",
    label: "An independent consultancy",
    description:
      "A consultancy built around understanding business problems before choosing technology.",
    detail:
      "kailor was founded in 2025 as an independent technology consultancy. The starting point is the situation a person or business is facing: what needs attention, what is already in place and what a practical next step could look like.",
  },
  {
    id: "approach",
    date: "2025–2026",
    title: "Understanding before solutions",
    icon: "understanding",
    label: "A considered approach",
    description:
      "Discovery, assessment and comparison give technology decisions a clearer starting point.",
    detail:
      "The approach brings business understanding and technical evaluation together. Existing platforms, integration, automation and custom engineering are considered in context. Recommending new software or AI is a decision to justify, rather than the default answer.",
  },
  {
    id: "discovery",
    date: "2026",
    title: "Discovery & Analysis",
    icon: "discovery",
    label: "Context becomes considered advice",
    description:
      "Guided questions, conversation and structured assessments connect the circumstances to possible directions.",
    detail:
      "The application combines guided Discovery with conversation, confirmed information and explicit unknowns. Structured Analysis, saved assessment reports and PDF exports make the reasoning available to review. Recommendations remain conditional on the information provided and the checks still needed.",
  },
  {
    id: "canvas",
    date: "2026",
    title: "Solution Canvas",
    icon: "canvas",
    label: "Making options easier to review",
    description:
      "Visual solution tiles make proposed directions and their reasoning easier to explore.",
    detail:
      "The Solution Canvas presents concrete, evidence-supported directions as individual tiles. Customers can open details, refine ideas and select solutions for consideration. A consultancy request carries selected context into review; choosing a tile does not automatically commission implementation.",
  },
  {
    id: "workspaces",
    date: "2026",
    title: "Connected project workspaces",
    icon: "workspace",
    label: "Continuity within each project",
    description:
      "Conversations, sources, assessments and decisions stay with their own project context.",
    detail:
      "Independent project workspaces retain their own conversations, Discovery context, sources, Canvas and report history. Projects can be resumed without mixing their knowledge. Consultancy requests carry the relevant project and selected solutions into the consultant review process.",
  },
  {
    id: "experience",
    date: "2026",
    title: "Website & customer application",
    icon: "website",
    label: "A connected digital experience",
    description:
      "The public website and authenticated customer application bring the approach together.",
    detail:
      "The public website explains kailor’s consultancy and engineering approach. The authenticated customer application provides accounts and independent project experiences spanning Discovery, conversation, Analysis, sources and the Solution Canvas. Together, they connect the consultancy approach with a place to explore options and keep project knowledge organised.",
  },
  {
    id: "present",
    date: "Present",
    title: "Building on the foundation",
    icon: "present",
    label: "The work continues",
    description:
      "Strengthening the consultancy, improving the experience and extending what the platform can support.",
    detail:
      "The next chapter builds on the existing consultancy, website and customer application. The direction is to improve the experience, strengthen engineering delivery and extend useful integrations and capabilities. These are ongoing areas of work, without announced release dates or guaranteed outcomes.",
  },
];
export const archiveCapabilities = [
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
] as const satisfies readonly (TimelineDetailContent & { id: string })[];
