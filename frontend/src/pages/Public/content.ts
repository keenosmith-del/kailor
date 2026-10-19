import { Code2, BrainCircuit, Workflow, Cloud, Compass } from "lucide-react";
export const services = [
  {
    id: "software",
    title: "Software",
    second: "engineering.",
    icon: Code2,
    summary: "Useful software. Built around the way you work.",
    detail:
      "From a focused web application to a connected operational system, we design and build software around a clearly understood need. The starting point is your workflow, not a preferred framework.",
    tags: ["Web applications", "APIs & integrations", "System design"],
    deliverable:
      "A defined scope, considered architecture and a maintainable implementation.",
  },
  {
    id: "ai",
    title: "Artificial",
    second: "intelligence.",
    icon: BrainCircuit,
    summary: "Intelligence with a purpose. And a person in the loop.",
    detail:
      "Explore where language models and AI-assisted tools can help with understanding, drafting or organising information. We examine data, reliability, privacy and human review before recommending an approach.",
    tags: ["AI-assisted workflows", "Context & knowledge", "Human oversight"],
    deliverable:
      "A feasibility assessment and a bounded approach to testing usefulness and reliability.",
  },
  {
    id: "automation",
    title: "Business",
    second: "automation.",
    icon: Workflow,
    summary: "Less repetition. More room for the work that matters.",
    detail:
      "Map the hand-offs, duplicated records and recurring tasks that slow you down. Connect suitable tools or simplify the process first, with custom automation where there is a clear gap.",
    tags: ["Process mapping", "Connected tools", "Practical workflows"],
    deliverable:
      "A workflow map, prioritised opportunities and an agreed implementation scope.",
  },
  {
    id: "cloud",
    title: "Cloud engineering",
    second: "& infrastructure.",
    icon: Cloud,
    summary: "A sound foundation for whatever comes next.",
    detail:
      "Plan hosting, deployment and infrastructure around your actual needs. Consider access, resilience, monitoring and operating cost alongside the software itself.",
    tags: ["Deployment", "Infrastructure", "Operational readiness"],
    deliverable:
      "An infrastructure plan with explicit operating responsibilities and constraints.",
  },
  {
    id: "consulting",
    title: "Technology",
    second: "consulting.",
    icon: Compass,
    summary: "A clearer direction before a bigger investment.",
    detail:
      "Turn a broad idea or a specific technical requirement into a practical next step. Compare existing platforms, conventional software and AI with the same care. Sometimes the right recommendation is to build less.",
    tags: ["Discovery", "Platform selection", "Solution design"],
    deliverable:
      "An assessment of options, trade-offs and a practical recommendation.",
  },
];
export const steps = [
  [
    "Discovery",
    "Start with your situation, your goals and the questions you need answered.",
  ],
  [
    "Understanding",
    "Clarify the workflow, existing tools, constraints and information still missing.",
  ],
  [
    "Analysis",
    "Compare practical options, assumptions, dependencies and trade-offs.",
  ],
  [
    "Recommendations",
    "Agree a useful next step, with a clear distinction between evidence and uncertainty.",
  ],
  [
    "Possible implementation",
    "If there is a fit, define a separate scope, responsibilities and commercial agreement.",
  ],
];
export const engagements = [
  {
    name: "Free",
    note: "Exploration · availability to be confirmed",
    text: "An entry point to exploring your situation through the evolving Discovery platform. A commercial free tier and its limits are not yet confirmed.",
    items: [
      "Learn about the process",
      "Understand the platform's role",
      "Enquire about access",
    ],
    action: "Ask about exploration",
    subject: "Exploration access",
  },
  {
    name: "Guided",
    note: "Consultant-supported · by enquiry",
    text: "Work through your situation with professional input. Agree the depth of assessment, review and recommendations before starting.",
    items: [
      "Discuss goals and constraints",
      "Agree assessment scope",
      "Request a tailored quote",
    ],
    action: "Discuss an assessment",
    subject: "Guided assessment",
  },
  {
    name: "Custom",
    note: "Project-based · scoped individually",
    text: "Software, automation, AI or infrastructure work shaped around an agreed requirement. Feasibility and delivery are confirmed together.",
    items: [
      "Explore technical feasibility",
      "Define deliverables",
      "Agree scope and pricing",
    ],
    action: "Discuss a project",
    subject: "Custom project enquiry",
  },
];
export const email = "keenosmith@kailor.co.za";
export const mail = (subject: string) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}`;
