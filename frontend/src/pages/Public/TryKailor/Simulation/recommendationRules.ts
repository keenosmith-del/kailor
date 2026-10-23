import {
  chosenAt,
  completeJourney,
  type Answer,
  type Direction,
} from "./simulationData";
export interface RecommendationContent {
  id: Direction;
  title: string;
  message: string;
  direction: string;
  description: string;
  next: string;
  why: string;
  discovery: string;
}
const directions: Record<
  Direction,
  {
    title: string;
    message: string;
    direction: string;
    description: string;
    discovery: string;
  }
> = {
  workflow: {
    title: "Start with the everyday workflow",
    message:
      "I'd begin by mapping the current process and identifying which steps can be simplified before introducing automation.",
    direction: "Simplify your workflow",
    description:
      "Map one repeated process and explore a smaller, clearer way to complete it.",
    discovery:
      "Who performs each step, which decisions need judgement, what the tools already support and where exceptions occur.",
  },
  integration: {
    title: "Make the connections clearer",
    message:
      "Your tools may already handle much of what you need. A focused integration assessment could explore how information should move between them.",
    direction: "Connect existing systems",
    description:
      "Review information flow and possible connections between the tools you already use.",
    discovery:
      "System access, data ownership, update frequency, permissions and how failed or conflicting updates would be handled.",
  },
  digital: {
    title: "Shape the experience around its users",
    message:
      "I'd look at the audience, the task they need to complete and what already exists before choosing between a focused improvement and a new application.",
    direction: "Review your digital experience",
    description: "Define the user journey and a useful, bounded first scope.",
    discovery:
      "The audience, accessibility, existing experiences, essential tasks, constraints and how a proposed change could be tested.",
  },
  ai: {
    title: "Explore assistance with a clear purpose",
    message:
      "I'd first understand the task and the information it depends on. That can help establish where AI assistance is useful and where conventional software or human review is more appropriate.",
    direction: "Explore an AI-assisted process",
    description:
      "Evaluate a small assistance task, with information boundaries and human oversight.",
    discovery:
      "Suitable data, permission to use it, human review, evaluation criteria and a conventional alternative to compare against.",
  },
  technical: {
    title: "Understand the foundations first",
    message:
      "I'd start with a technical review of the current systems, their limitations and the requirements they need to support, before proposing a replacement or a new tool.",
    direction: "Assess your technical foundations",
    description:
      "Establish the current setup, constraints and questions that need investigation.",
    discovery:
      "System ownership, access, architecture, operational needs, constraints and the evidence needed to compare possible approaches.",
  },
  idea: {
    title: "Give the idea a testable shape",
    message:
      "The next useful step may be to narrow the idea into a small, testable scope. Understanding who it's for and the problem it solves can guide the technical decisions that follow.",
    direction: "Define your product direction",
    description:
      "Clarify the audience, problem and smallest useful experiment.",
    discovery:
      "The people affected, the problem in context, existing alternatives, assumptions and what a small experiment should teach you.",
  },
  cloud: {
    title: "Start with the operating requirements",
    message:
      "A review of hosting, application architecture and operational requirements would help identify an infrastructure approach before committing to a platform or migration.",
    direction: "Review your infrastructure",
    description:
      "Understand deployment, hosting and operational responsibilities before selecting a platform.",
    discovery:
      "Current architecture, access, recovery needs, deployment practices, support responsibilities and operating constraints.",
  },
};
export function recommend(
  answers: readonly Answer[],
): RecommendationContent | null {
  if (!completeJourney(answers)) return null;
  const choices = answers.map((_, i) => chosenAt(answers, i)!);
  let id = choices[1].direction!;
  let reason = `You chose “${choices[1].label}” and “${choices[2].label}”.`;
  if (choices[2].id === "access-limited") {
    id = "technical";
    reason +=
      " Limited access makes a technical review useful before planning a connection.";
  }
  if (choices[2].id === "audience-unclear") {
    id = "idea";
    reason += " Clarifying the audience comes before choosing a build.";
  }
  if (choices[2].id === "data-unclear") {
    id = "technical";
    reason +=
      " The information and permissions need to be understood before exploring AI.";
  }
  const content = directions[id];
  const opening =
    choices[0].id === "idea"
      ? "For the idea you're exploring, "
      : choices[0].id === "specific"
        ? "For the work you have in mind, "
        : choices[0].id === "unsure"
          ? "To find a useful starting point, "
          : "For the work you want to improve, ";
  return {
    ...content,
    id,
    message:
      opening +
      (content.message.startsWith("I\'d")
        ? content.message
        : content.message.charAt(0).toLowerCase() + content.message.slice(1)) +
      " " +
      choices[2].consideration,
    why:
      reason +
      ` Your priority, “${choices[3].label}”, helps frame the next conversation.`,
    next: choices[3].consideration!,
  };
}
