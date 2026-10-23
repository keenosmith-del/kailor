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
    value: "8+",
    description:
      "A portfolio of independently developed software and technical systems, spanning business intelligence, operational automation, financial technology, cloud architecture and AI-enabled applications.",
    animateCount: true,
    basis:
      "At least eight distinct source-reviewed implementations in the local portfolio audit; excludes forks, documentation-only plans and duplicate versions",
  },
  {
    label: "Consultancy experience",
    value: "3+",
    description:
      "Documented engagements involving business process assessment, AI-enabled applications and operational automation, with technical recommendations shaped around real organisational needs.",
    animateCount: true,
    basis:
      "Three separate confidential engagement entries in the owner CV source; identities withheld",
  },
];
export const perspectiveMetrics: readonly HomeMetric[] = [
  {
    label: "Operational efficiency",
    value: "Simplify",
    description:
      "Reduce repetitive administration, fragmented processes and unnecessary manual work through better software, practical automation and more considered operational systems.",
    basis:
      "Editorial description of engineering scope; not a measured business result",
  },
  {
    label: "Connected technology",
    value: "Integrate",
    description:
      "Bring applications, data and business processes together so information moves more reliably between the tools an organisation already depends on.",
    basis:
      "Editorial description of engineering scope; not a measured business result",
  },
  {
    label: "Purpose-built engineering",
    value: "Build",
    description:
      "Engineer web applications, internal platforms and intelligent software around real requirements, with architecture designed for usability, security and continued development.",
    basis:
      "Editorial description of engineering scope; not a measured business result",
  },
  {
    label: "Long-term technical thinking",
    value: "Evolve",
    description:
      "Improve existing systems, modernise infrastructure and extend software capabilities as operational requirements, customer expectations and technology change.",
    basis:
      "Editorial description of engineering scope; not a measured business result",
  },
];

// Owner-supplied display content; review the business claim before deployment.
export const introductionAdditionalCount = 32;
