import { technologyItems } from "./Marquee/marqueeData";
export interface HomeMetric {
  label: string;
  value: string;
  description: string;
  animateCount?: boolean;
  kind: "experience" | "year" | "capability" | "principle";
  basis: string;
}
// Add commercial figures only when verified business records support them.
// These current figures describe the company and implemented technical capabilities.
export const introductionMetrics: readonly HomeMetric[] = [
  {
    label: "Engineering foundation",
    value: "6+",
    animateCount: true,
    kind: "experience",
    basis: "Owner-provided engineering experience, predating the company",
    description:
      "Years of hands-on engineering behind kailor, spanning full-stack applications, system architecture, cloud, AI-enabled software and complex workflow automation.",
  },
  {
    label: "Established in",
    value: "2025",
    kind: "year",
    basis: "Owner-confirmed founding year",
    description:
      "Founded as an independent technology consultancy, connecting technical strategy with practical engineering.",
  },
  {
    label: "Built capabilities",
    value: "4",
    animateCount: true,
    kind: "capability",
    basis:
      "Implemented Discovery, Analysis, Solution Canvas and independent project workspaces",
    description:
      "Discovery, Analysis, Solution Canvas and independent project workspaces connect technical decisions with the work that follows.",
  },
];
export const perspectiveMetrics: readonly HomeMetric[] = [
  {
    label: "Technology breadth",
    value: `${technologyItems.length}+`,
    kind: "capability",
    basis:
      "Named local technology inventory; not a count of client deployments",
    description:
      "A toolkit spanning application frameworks, AI, cloud, databases and integrations. We choose technology for the problem, rather than force every project into one stack.",
  },
  {
    label: "Connected project journey",
    value: "5",
    kind: "capability",
    basis:
      "Discovery, Analysis, recommendations, consultancy and separately commissioned implementation",
    description:
      "Discovery, Analysis, recommendations, consultancy and implementation form a connected journey. Decisions and context carry forward; delivery is scoped and commissioned separately.",
  },
  {
    label: "Independent project context",
    value: "1:1",
    kind: "principle",
    basis: "Existing per-project isolation in the customer application",
    description:
      "Each project has its own workspace for conversations, sources, assessments, solutions and consultancy discussions, keeping unrelated project knowledge separate.",
  },
  {
    label: "Decisions worth keeping",
    value: "PDF",
    kind: "capability",
    basis: "Existing saved assessments and PDF report exports",
    description:
      "Structured assessments, technical recommendations and documented considerations can be revisited, shared and used to support informed decisions throughout the project.",
  },
];
