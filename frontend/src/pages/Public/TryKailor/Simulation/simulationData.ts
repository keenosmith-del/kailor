export type Situation = "business" | "idea" | "unsure" | "specific";
export type Direction =
  | "workflow"
  | "integration"
  | "digital"
  | "ai"
  | "technical"
  | "idea"
  | "cloud";
export interface Choice {
  id: string;
  label: string;
  direction?: Direction;
  consideration?: string;
}
export interface Question {
  id: string;
  title: string;
  note: string;
  choices: readonly Choice[];
}
export interface Answer {
  questionId: string;
  choiceId: string;
}
export const startingQuestion: Question = {
  id: "situation",
  title: "Which best describes you?",
  note: "Choose the starting point that feels closest",
  choices: [
    { id: "business", label: "I own a business" },
    { id: "idea", label: "I have an idea" },
    { id: "unsure", label: "I don't know where to start" },
    { id: "specific", label: "I know exactly what I want" },
  ],
};
const focusQuestions: Record<Situation, Question> = {
  business: {
    id: "business-focus",
    title: "What needs attention?",
    note: "Think about the work you would most like to improve",
    choices: [
      { id: "manual", label: "Too much manual work", direction: "workflow" },
      {
        id: "disconnected",
        label: "Disconnected information",
        direction: "integration",
      },
      { id: "online", label: "Our online presence", direction: "digital" },
      {
        id: "systems",
        label: "Understanding our current systems",
        direction: "technical",
      },
    ],
  },
  idea: {
    id: "idea-focus",
    title: "What would you like to create?",
    note: "The idea can still be taking shape",
    choices: [
      {
        id: "application",
        label: "A website or application",
        direction: "digital",
      },
      {
        id: "internal",
        label: "An internal business tool",
        direction: "workflow",
      },
      { id: "intelligent", label: "An AI-enabled experience", direction: "ai" },
      { id: "shaping", label: "I'm still shaping the idea", direction: "idea" },
    ],
  },
  unsure: {
    id: "unsure-focus",
    title: "Which challenge feels most familiar?",
    note: "You don't need to know the technical solution",
    choices: [
      {
        id: "admin",
        label: "Repetitive administration",
        direction: "workflow",
      },
      {
        id: "information",
        label: "Information is difficult to manage",
        direction: "integration",
      },
      {
        id: "limitations",
        label: "Existing technology is limiting us",
        direction: "technical",
      },
      {
        id: "guidance",
        label: "We need guidance on the possibilities",
        direction: "idea",
      },
    ],
  },
  specific: {
    id: "specific-focus",
    title: "What type of work do you have in mind?",
    note: "We'll use this to focus the next question",
    choices: [
      { id: "software", label: "Software development", direction: "digital" },
      {
        id: "connections",
        label: "Systems integration",
        direction: "integration",
      },
      { id: "automation", label: "AI or automation", direction: "ai" },
      {
        id: "infrastructure",
        label: "Cloud infrastructure",
        direction: "cloud",
      },
    ],
  },
};
const contextQuestions: Record<Direction, Question> = {
  workflow: {
    id: "workflow-context",
    title: "How does the work happen today?",
    note: "Start with the process, rather than a particular tool",
    choices: [
      {
        id: "manual-records",
        label: "Mostly manual records",
        consideration:
          "Write down one repeated task, including the decisions a person makes along the way.",
      },
      {
        id: "mixed-tools",
        label: "Spreadsheets and separate tools",
        consideration:
          "Identify which record should be authoritative before connecting or automating updates.",
      },
      {
        id: "single-system",
        label: "One system with awkward workarounds",
        consideration:
          "Check what the current system can already support before adding another tool.",
      },
    ],
  },
  integration: {
    id: "integration-context",
    title: "What do you know about the existing tools?",
    note: "Connections depend on access as well as the information itself",
    choices: [
      {
        id: "access-known",
        label: "We know how to access the data",
        consideration:
          "Confirm permissions, data ownership and how exceptions should be handled.",
      },
      {
        id: "access-limited",
        label: "Access or exports are limited",
        consideration:
          "Establish what the tools allow before committing to an integration.",
      },
      {
        id: "access-unknown",
        label: "We haven't checked yet",
        consideration:
          "List the tools involved and confirm their integration and export options.",
      },
    ],
  },
  digital: {
    id: "digital-context",
    title: "What already exists?",
    note: "A focused improvement can be as useful as a new build",
    choices: [
      {
        id: "existing-experience",
        label: "An experience we want to improve",
        consideration:
          "Bring an example of where the current experience makes a user's task difficult.",
      },
      {
        id: "new-experience",
        label: "This would be something new",
        consideration:
          "Choose one audience and the first task the experience should help them complete.",
      },
      {
        id: "audience-unclear",
        label: "The audience and purpose are still unclear",
        consideration:
          "Test the problem and audience before committing to a website or application.",
      },
    ],
  },
  ai: {
    id: "ai-context",
    title: "What information would the process use?",
    note: "Useful assistance depends on appropriate, reliable information",
    choices: [
      {
        id: "data-ready",
        label: "Information we understand and can access",
        consideration:
          "Define a small evaluation task and compare AI assistance with a conventional approach.",
      },
      {
        id: "data-sensitive",
        label: "Sensitive information needing careful handling",
        consideration:
          "Agree privacy, access and human-review requirements before testing with any sensitive information.",
      },
      {
        id: "data-unclear",
        label: "We haven't established that yet",
        consideration:
          "Clarify the task, information sources and permissions before choosing an AI tool.",
      },
    ],
  },
  technical: {
    id: "technical-context",
    title: "What would you most like to understand?",
    note: "A review should be guided by a practical question",
    choices: [
      {
        id: "system-limits",
        label: "The limits of our current systems",
        consideration:
          "Gather examples of the limitations, along with the requirements the systems need to support.",
      },
      {
        id: "reliability",
        label: "Reliability and maintainability",
        consideration:
          "Describe the operational symptoms and who currently supports the system.",
      },
      {
        id: "unknown-foundations",
        label: "What we have and how it fits together",
        consideration:
          "Start with a simple inventory of applications, owners and dependencies.",
      },
    ],
  },
  idea: {
    id: "idea-context",
    title: "How far have you explored the idea?",
    note: "Choose what you know today",
    choices: [
      {
        id: "audience-known",
        label: "We know who it's for",
        consideration:
          "Talk to that audience about the problem before deciding the feature list.",
      },
      {
        id: "problem-unclear",
        label: "The problem still needs defining",
        consideration:
          "Describe one real situation where someone would benefit from the idea.",
      },
      {
        id: "prototype",
        label: "We have an early sketch or prototype",
        consideration:
          "Use the prototype to test the riskiest assumption, rather than adding more features.",
      },
    ],
  },
  cloud: {
    id: "cloud-context",
    title: "What is the infrastructure starting point?",
    note: "The operating requirements matter more than a platform name",
    choices: [
      {
        id: "current-hosting",
        label: "Existing hosting needs review",
        consideration:
          "Bring the current architecture, access arrangements and operating requirements to a review.",
      },
      {
        id: "first-deployment",
        label: "A first deployment",
        consideration:
          "Define who will operate the service, how it will be recovered and what access it needs.",
      },
      {
        id: "operational-concerns",
        label: "Reliability or deployment concerns",
        consideration:
          "Identify the failure or deployment scenarios that need attention before considering a migration.",
      },
    ],
  },
};
const finalQuestions: Record<Situation, Question> = {
  business: {
    id: "business-priority",
    title: "What would make the biggest difference?",
    note: "Choose the outcome that matters first",
    choices: [
      {
        id: "time",
        label: "Less time spent on routine work",
        consideration:
          "Use time spent on that routine as a starting point for discussing priorities.",
      },
      {
        id: "accuracy",
        label: "More consistent information",
        consideration:
          "Agree what accurate information looks like and who should maintain it.",
      },
      {
        id: "visibility",
        label: "A clearer view of what's happening",
        consideration:
          "Identify the decisions that better visibility should support.",
      },
    ],
  },
  idea: {
    id: "idea-priority",
    title: "What would help you move the idea forward?",
    note: "A small next step is enough",
    choices: [
      {
        id: "small-test",
        label: "A small, testable first version",
        consideration:
          "Keep the first scope small enough to test one useful outcome.",
      },
      {
        id: "validate-audience",
        label: "Understanding the audience better",
        consideration:
          "Include conversations with potential users before deciding what to build.",
      },
      {
        id: "feasibility",
        label: "Understanding what's technically possible",
        consideration:
          "Separate what needs a technical investigation from what can first be tested without software.",
      },
    ],
  },
  unsure: {
    id: "unsure-priority",
    title: "What would be most useful next?",
    note: "We can start with clarity, without a commitment to build",
    choices: [
      {
        id: "map",
        label: "Map the current situation",
        consideration:
          "Begin with a shared picture of the people, tools and work involved.",
      },
      {
        id: "compare",
        label: "Compare possible approaches",
        consideration:
          "Compare improving the current setup with introducing something new.",
      },
      {
        id: "discuss",
        label: "Talk through the challenge",
        consideration:
          "Bring a concrete example to an initial conversation, without sharing confidential information here.",
      },
    ],
  },
  specific: {
    id: "specific-priority",
    title: "How defined is the scope?",
    note: "A clear request still needs its assumptions checked",
    choices: [
      {
        id: "scope-defined",
        label: "Requirements are already written down",
        consideration:
          "Review those requirements, dependencies and acceptance criteria before agreeing implementation.",
      },
      {
        id: "scope-draft",
        label: "We have an outline to refine",
        consideration:
          "Turn the outline into a bounded scope with explicit assumptions and exclusions.",
      },
      {
        id: "scope-review",
        label: "We'd like advice before committing",
        consideration:
          "Confirm the underlying need before committing to the proposed technical approach.",
      },
    ],
  },
};
export function questionAt(
  answers: readonly Answer[],
  index: number,
): Question | null {
  if (index === 0) return startingQuestion;
  const start = answers[0];
  if (
    start?.questionId !== startingQuestion.id ||
    !startingQuestion.choices.some((c) => c.id === start.choiceId)
  )
    return null;
  const focus = focusQuestions[start.choiceId as Situation];
  if (index === 1) return focus;
  const chosen = focus.choices.find(
    (c) => c.id === answers[1]?.choiceId && answers[1]?.questionId === focus.id,
  );
  if (!chosen?.direction) return null;
  if (index === 2) return contextQuestions[chosen.direction];
  if (index === 3) return finalQuestions[start.choiceId as Situation];
  return null;
}
export function chosenAt(
  answers: readonly Answer[],
  index: number,
): Choice | undefined {
  const q = questionAt(answers, index);
  return answers[index]?.questionId === q?.id
    ? q?.choices.find((c) => c.id === answers[index].choiceId)
    : undefined;
}
export function completeJourney(answers: readonly Answer[]) {
  return (
    answers.length === 4 && answers.every((_, i) => !!chosenAt(answers, i))
  );
}
