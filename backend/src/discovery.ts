import {
  capabilityPatterns,
  operationalPattern,
  projectRequirements,
} from "./requirements.js";
import {
  explorationQuestions,
  explorationKeys,
  isExploration,
} from "./exploration.js";
import { signalAnswers } from "./context-extraction.js";
import type { Answers, Question, AnswerValue } from "../../shared/src/index.js";
import { contextualQuestions } from "./contextual-intelligence.js";
const options = (...items: string[]) =>
  items.map((item) => {
    const [value, label] = item.split("|");
    return { value, label: label ?? value };
  });
export const version = "1.0.0";
export const questions: Question[] = [
  {
    id: "stage",
    title: "Where are you right now?",
    hint: "There is no wrong starting point.",
    type: "single",
    options: options(
      "established|I'm already established.",
      "starting|I'm just getting started.",
      "uncertain|I don't know where to start.",
      "specific|I know exactly what I want.",
    ),
  },
  {
    id: "kind",
    title: "What best describes your work?",
    hint: "This helps us ask useful questions.",
    type: "single",
    options: options(
      "business|A business",
      "professional|An independent professional",
      "individual|A personal project or idea",
    ),
  },
  {
    id: "industry",
    title: "Tell us a little about what you do.",
    hint: "Your profession, offering or idea — in your own words.",
    type: "text",
  },
  {
    id: "idea",
    title: "What would you like to bring to life?",
    hint: "Who is it for, and what would it help them do?",
    type: "text",
    when: { key: "stage", values: ["starting"] },
  },
  {
    id: "progress",
    title: "How far along are you?",
    hint: "An idea, early customers, or something already taking shape?",
    optional: true,
    allowNotApplicable: true,
    type: "text",
    when: { key: "stage", values: ["starting"] },
  },
  {
    id: "request",
    title: "What do you have in mind?",
    hint: "Describe the functionality, intended users and expected outcome.",
    type: "text",
    when: { key: "stage", values: ["specific"] },
  },
  {
    id: "frustrations",
    title: "What feels harder than it should?",
    hint: "Think about repetitive work, missed opportunities or an idea you cannot quite express.",
    type: "text",
    when: { key: "stage", values: ["uncertain"] },
  },
  {
    id: "portfolio",
    title: "How should people experience your work?",
    hint: "Describe your existing work, portfolio, enquiries and presentation needs.",
    optional: true,
    allowNotApplicable: true,
    type: "text",
    when: { key: "kind", values: ["professional"] },
  },
  {
    id: "presence",
    title: "Where can people find you today?",
    hint: "Choose everything that applies.",
    optional: true,
    type: "multi",
    options: options(
      "instagram|Instagram / social channels",
      "website|A website",
      "email|Professional email",
      "marketplace|A marketplace",
      "none|Nowhere online yet",
    ),
  },
  {
    id: "website",
    title: "How is your website working for you?",
    hint: "What works, what is outdated, and what needs to improve?",
    optional: true,
    allowNotApplicable: true,
    type: "text",
    when: { key: "presence", values: ["website"] },
  },
  {
    id: "tools",
    title: "What tools are part of your day?",
    hint: "For example WhatsApp, spreadsheets, accounting software or a booking platform.",
    optional: true,
    allowNotApplicable: true,
    type: "text",
  },
  {
    id: "problems",
    title: "Where would a little help make a difference?",
    hint: "Select the challenges you actually experience.",
    type: "multi",
    options: [
      ...capabilityPatterns.map(([id, label]) => ({
        value: `capability-${id}`,
        label,
      })),
      ...options(
        "credibility|Presenting my work professionally",
        "booking|Managing appointments",
        "invoices|Preparing or following up invoices",
        "content|Recurring content or research",
        "outdated|An outdated website",
        "custom|A specific tool or application",
        "none|Still exploring",
      ),
    ],
  },
  {
    id: "bookingDetails",
    title: "What gets in the way of a smooth booking?",
    hint: "Current volume, missed appointments, manual steps and client preferences.",
    optional: true,
    allowNotApplicable: true,
    type: "text",
    when: { key: "problems", values: ["booking"] },
  },
  {
    id: "invoiceDetails",
    title: "Walk us through an invoice.",
    hint: "Which steps repeat? Which accounting tools or approval rules must stay?",
    optional: true,
    allowNotApplicable: true,
    type: "text",
    when: { key: "problems", values: ["invoices"] },
  },
  {
    id: "contentDetails",
    title: "What repeats in your content or research process?",
    hint: "Sources, cadence, review and publishing. Include what must remain under your control.",
    optional: true,
    allowNotApplicable: true,
    type: "text",
    when: { key: "problems", values: ["content"] },
  },
  {
    id: "clarification",
    title: "What is one task, difficulty or outcome we should understand?",
    hint: "A concrete example is enough. Tell me what happens today and what you would like to change.",
    type: "text",
    optional: true,
  },
  {
    id: "bookingStatus",
    title: "Do you currently use a booking provider?",
    hint: "Record the current situation without assuming a change is needed.",
    type: "single",
    optional: true,
    options: options("existing|Yes", "absent|No", "unknown|Not sure"),
  },
  {
    id: "aiPreference",
    title: "Would you like AI considered?",
    hint: "It is optional and must suit the problem.",
    type: "single",
    optional: true,
    options: options(
      "requested|Consider it",
      "declined|No AI",
      "unknown|Not sure",
    ),
  },
  {
    id: "automationPreference",
    title: "Would you like automation considered?",
    hint: "Manual improvements may be enough.",
    type: "single",
    optional: true,
    options: options(
      "requested|Consider it",
      "declined|No automation",
      "unknown|Not sure",
    ),
  },
  {
    id: "websitePreference",
    title: "Would you like a website considered?",
    hint: "An existing channel may already be sufficient.",
    type: "single",
    optional: true,
    options: options(
      "requested|Consider it",
      "declined|No website",
      "unknown|Not sure",
    ),
  },
  {
    id: "websiteStatus",
    title: "Do you already have a website?",
    hint: "This only records what you tell us; no audit is implied.",
    type: "single",
    optional: true,
    options: options("existing|Yes", "absent|No", "unknown|Not sure"),
  },
  {
    id: "scopeDetails",
    title: "What must the first version do, and who will use it?",
    hint: "Essential features, current alternatives, user roles, data/privacy, review and export needs. Native mobile may not be necessary.",
    type: "text",
    optional: true,
    when: { key: "problems", values: ["custom"] },
  },
  {
    id: "workflowDetails",
    title: "Which process needs improvement?",
    hint: "Current steps, friction, records, users and desired outcome.",
    type: "text",
    optional: true,
  },
  {
    id: "websiteUrl",
    title: "Would you like to share your existing website URL?",
    hint: "We validate the address only. This does not perform an audit.",
    type: "text",
    optional: true,
    when: { key: "presence", values: ["website"] },
  },
  {
    id: "goals",
    title: "What would better look like?",
    hint: "A practical outcome matters more than a particular technology.",
    type: "text",
  },
  {
    id: "constraints",
    title: "What should we work around?",
    hint: "Technical comfort, existing systems, accessibility or privacy requirements.",
    allowNotApplicable: true,
    type: "text",
    optional: true,
  },
  {
    id: "budget",
    title: "Have you thought about an investment range?",
    hint: "“Not sure yet” is a useful answer. This is not a quotation.",
    type: "text",
    optional: true,
  },
  {
    id: "timing",
    title: "Is there a date that matters?",
    hint: "A launch, a busy season, or simply when you are ready.",
    allowNotApplicable: true,
    type: "text",
    optional: true,
  },
  {
    id: "branding",
    title: "Do you already have a business name and branding?",
    hint: "A name, logo or existing visual identity; it is fine if these are still open.",
    type: "text",
    optional: true,
  },
  {
    id: "launchContent",
    title: "Do you have photographs and service descriptions ready?",
    hint: "Tell us what exists and what still needs preparing.",
    type: "text",
    optional: true,
  },
  {
    id: "socialAccount",
    title: "Is your Instagram business page new or already established?",
    hint: "Account ownership and access will need confirming before setup.",
    type: "text",
    optional: true,
  },
  ...explorationQuestions,
  ...contextualQuestions,
  {
    id: "appPreference",
    title: "Should an application still be considered?",
    hint: "A simpler website or existing tool may be sufficient.",
    type: "single",
    optional: true,
    options: options(
      "requested|Consider an application",
      "declined|No application",
      "unknown|Not decided",
    ),
  },
];
export function relevant(q: Question, a: Answers) {
  if (["branding", "launchContent", "socialAccount"].includes(q.id))
    return /(?:want|need|like|build|set up).{0,160}(?:website|instagram)/i.test(
      Object.values(a).flat().join(" "),
    );
  if (explorationKeys.includes(q.id)) return a.stage === "uncertain";
  if (q.id === "scopeDetails" && a.appPreference === "declined") return false;
  return (
    !q.when ||
    q.when.values.some((v) =>
      Array.isArray(a[q.when!.key])
        ? (a[q.when!.key] as string[]).includes(v)
        : a[q.when!.key] === v,
    )
  );
}
export function activeQuestions(a: Answers) {
  return questions
    .map((q) => {
      if (q.id !== "problems") return q;
      const requirements = projectRequirements(a);
      const contextual = operationalPattern(a) && requirements.length >= 2;
      return {
        ...q,
        title: contextual
          ? "Which parts of this workflow need the most help?"
          : q.title,
        options: contextual
          ? [
              ...requirements
                .filter(
                  (r) =>
                    !r.id.startsWith("requirement-other-") &&
                    r.priority !== "deferred",
                )
                .slice(0, 7)
                .map((r) => ({
                  value: `capability-${r.id.replace("requirement-", "")}`,
                  label: r.label,
                })),
              { value: "custom", label: "Another challenge" },
            ]
          : q.options?.filter((o) => !o.value.startsWith("capability-")),
      };
    })
    .filter(
      (q) =>
        relevant(q, a) &&
        (!isExploration(a) ||
          q.id === "stage" ||
          explorationKeys.includes(q.id)),
    );
}
export function nextQuestion(a: Answers) {
  return (
    activeQuestions(a).find(
      (q) =>
        ![
          ...contextualQuestions.map((q) => q.id),
          "branding",
          "launchContent",
          "socialAccount",
          "appPreference",
          "scopeDetails",
          "workflowDetails",
          "websiteUrl",
          "websiteStatus",
          "clarification",
          "bookingStatus",
          "aiPreference",
          "automationPreference",
          "websitePreference",
        ].includes(q.id) && !(q.id in a),
    ) ?? null
  );
}
export function validateAnswer(id: string, value: AnswerValue, skip = false) {
  const q = questions.find((x) => x.id === id);
  if (!q) throw new Error("Unknown question");
  if (id === "websiteUrl" && !skip) {
    try {
      const url = new URL(String(value));
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error();
    } catch {
      throw new Error("Enter a valid public HTTP or HTTPS URL");
    }
  }
  if (skip) {
    if (!q.optional) throw new Error("This question is required");
    return q;
  }
  if (q.type === "text" && (typeof value !== "string" || !value.trim()))
    throw new Error("Enter a response");
  if (
    q.type === "single" &&
    (typeof value !== "string" || !q.options?.some((o) => o.value === value))
  )
    throw new Error("Choose a valid option");
  if (
    q.type === "multi" &&
    (!Array.isArray(value) ||
      !value.length ||
      new Set(value).size !== value.length ||
      value.some((v) => !q.options?.some((o) => o.value === v)) ||
      (value.includes("none") && value.length > 1))
  )
    throw new Error("Choose valid, non-conflicting options");
  return q;
}
export function pruneAnswers(a: Answers, context: Answers = a): Answers {
  const result = { ...a };
  for (const q of questions)
    if (!relevant(q, signalAnswers(context, false))) delete result[q.id];
  return result;
}
