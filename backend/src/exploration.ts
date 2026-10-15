import type {
  Answers,
  AnswerStates,
  Question,
} from "../../shared/src/index.js";

export const explorationQuestions: Question[] = [
  {
    id: "motivation",
    title: "What draws you to starting something?",
    hint: "Extra income, independence, a creative outlet, or simply curiosity are all useful starting points.",
    type: "text",
    optional: true,
  },
  {
    id: "interests",
    title: "What do you enjoy doing or learning about?",
    hint: "Think about a good afternoon: helping someone, making something, being outdoors, organising, or exploring a subject.",
    type: "text",
    optional: true,
  },
  {
    id: "strengths",
    title: "What do people ask you for help with?",
    hint: "Everyday experience counts. You do not need a qualification or a business skill.",
    type: "text",
    optional: true,
  },
  {
    id: "explorationTime",
    title: "What could a small experiment fit around?",
    hint: "Time available, a phone or other resources you already have, and anything you want to avoid. No budget commitment is needed.",
    type: "text",
    optional: true,
  },
  {
    id: "opportunityStyle",
    title: "Which kind of experiment feels easiest to try?",
    hint: "This is an option to explore, not a commitment or evidence of demand.",
    type: "single",
    optional: true,
    options: [
      { value: "service", label: "Help someone with a small service" },
      { value: "product", label: "Make or test a small product" },
      { value: "content", label: "Share or teach something" },
      { value: "explore", label: "Explore examples together first" },
    ],
  },
  {
    id: "experimentComfort",
    title: "How would you prefer to take a first step?",
    hint: "For example: talk to someone, observe a need nearby, try a free tool, or practise privately. You can leave this open.",
    type: "text",
    optional: true,
  },
];
export const explorationKeys = explorationQuestions.map((q) => q.id);
export function explorationProgress(a: Answers) {
  return explorationKeys.filter((k) => k in a).length;
}
export function explorationQuestion(
  a: Answers,
  states: AnswerStates,
): Question | null {
  const uncertain = explorationKeys.filter((k) =>
    ["unknown", "skipped"].includes(states[k]),
  ).length;
  const remaining = explorationQuestions.filter((q) => !(q.id in a));
  // Repeated uncertainty changes the approach to simple examples rather than asking more abstract questions.
  if (uncertain >= 2 && !("opportunityStyle" in a))
    return explorationQuestions[4];
  if (explorationProgress(a) >= 4) return null;
  return remaining[0] ?? null;
}
export function opportunityDirections(a: Answers) {
  const options = [
    {
      id: "service",
      title: "A small service experiment",
      description:
        "Ask one person about a task they find difficult. Offer a small trial only if it fits skills and time you actually have.",
    },
    {
      id: "product",
      title: "A product experiment",
      description:
        "Sketch or demonstrate a small product before buying stock. Ask intended users what they use today and whether the problem matters.",
    },
    {
      id: "content",
      title: "A sharing or teaching experiment",
      description:
        "Try one useful explanation or demonstration on a topic you choose. Notice questions and feedback before committing to a channel.",
    },
  ];
  return options.filter(
    (o) =>
      !a.opportunityStyle ||
      a.opportunityStyle === "explore" ||
      a.opportunityStyle === o.id,
  );
}

export function isExploration(a: Answers) {
  return (
    a.stage === "uncertain" &&
    !["workflowDetails", "invoiceDetails", "bookingDetails", "request"].some(
      (k) => !!a[k],
    )
  );
}
