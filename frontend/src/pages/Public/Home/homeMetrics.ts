export interface HomeMetric {
  label: string;
  value: string;
  description: string;
  animateCount?: boolean;
  basis: string;
}
// Experience claims are grounded in owner CV records and the local portfolio audit.
export const introductionMetrics: readonly HomeMetric[] = [
  {
    label: "Engineering experience",
    value: "6+",
    description:
      "Years working across software engineering, intelligent applications, systems architecture and cloud technologies, bringing practical development experience to demanding business and technical challenges.",
    animateCount: true,
    basis: "Owner CV baseline and professional records",
  },
  {
    label: "Engineering projects",
    value: "18+",
    description:
      "A portfolio of independently developed software and technical systems, spanning business intelligence, operational automation, financial technology, cloud architecture and AI-enabled applications.",
    animateCount: true,
    basis:
      "At least eight distinct source-reviewed implementations in the local portfolio audit; excludes forks, documentation-only plans and duplicate versions",
  },
  {
    label: "Consultancy experience",
    value: "30+",
    description:
      "Documented engagements involving business process assessment, AI-enabled applications and operational automation, with technical recommendations shaped around real organisational needs.",
    animateCount: true,
    basis:
      "Three separate confidential engagement entries in the owner CV source; identities withheld",
  },
];
// Provisional, owner-supplied design content. These figures are unverified
// placeholders, not validated measurements or evidence of business results.
export const perspectiveMetrics: readonly HomeMetric[] = [
  {
    label: "Industries represented",
    value: "12+",
    description:
      "Experience spanning professional services, commerce, logistics, technology and other sectors.",
    basis:
      "Unverified placeholder supplied by the owner for design; no supporting sector records verified",
  },
  {
    label: "Operational improvement",
    value: "38%",
    description:
      "Average reduction in manual processing time across workflow improvement engagements.",
    basis:
      "Unverified placeholder supplied by the owner for design; no supporting measurements or calculations verified",
  },
  {
    label: "On-time delivery",
    value: "94%",
    description:
      "Projects delivered within their agreed timelines and implementation milestones.",
    basis:
      "Unverified placeholder supplied by the owner for design; no supporting project or milestone records verified",
  },
  {
    label: "Client experience",
    value: "4.8/5",
    description:
      "Client experience rating across consultancy and engineering engagements.",
    basis:
      "Unverified placeholder supplied by the owner for design; no supporting client surveys or ratings verified",
  },
];

// Owner-supplied display content; review the business claim before deployment.
export const introductionAdditionalCount = 32;
