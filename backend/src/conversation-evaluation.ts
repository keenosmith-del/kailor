import { MockProvider } from "./ai.js";
import { planDiscovery } from "./discovery-planner.js";
import type { Answers } from "../../shared/src/index.js";

// Independently authored expectations; this evaluates deterministic fallback, not live model quality.
const scenarios = [
  {
    id: "casual-to-portfolio",
    turns: [
      { message: "Hi.", reply: /what are you working on/i, facts: false },
      { message: "How are you?", reply: /ready to help/i, facts: false },
      {
        message: "I'm thinking about building a portfolio.",
        reply: /creating something new/i,
        facts: false,
      },
      {
        message: "I want a personal website for my photography work.",
        reply: /review.*suggested project details|confirm.*proposed change/i,
        keys: ["goals"],
      },
    ],
  },
  {
    id: "numbered-comparison",
    turns: [
      {
        message: "Would I need a website or an app?",
        reply: /1\. A website[\s\S]*2\. A mobile/i,
        facts: false,
      },
      {
        message: "What would the second one involve?",
        reply: /mobile application/i,
        facts: false,
      },
      {
        message: "Would the first one be cheaper?",
        reply: /website[\s\S]*no approved price/i,
        facts: false,
      },
    ],
  },
  {
    id: "nail-business",
    turns: [
      {
        message:
          "I run a small nail business on my own. I advertise on Instagram and take bookings through WhatsApp.",
        reply: /customers find you or book/i,
        keys: ["industry", "tools", "presence"],
      },
      {
        message:
          "I want to look more professional and make bookings easier, but I don't want an expensive application.",
        reply: /book a time directly/i,
        keys: ["goals", "constraints", "problems"],
      },
      { message: "Thanks.", reply: /welcome/i, facts: false },
    ],
    ready: true,
  },
  {
    id: "unknown-domain",
    turns: [
      {
        message:
          "I coordinate safety inspections at agricultural equipment sites, and technicians need to complete reports even when they're offline.",
        reply: /offline|record|connection|report/i,
        keys: ["industry"],
      },
      {
        message: "What if I wanted online-only reports instead?",
        reply: /possibility|clarif|offline|record/i,
        facts: false,
      },
    ],
  },
  {
    id: "change-of-mind",
    turns: [
      {
        message: "I want a mobile application for my business.",
        reply: /review.*suggested project details|confirm.*proposed change/i,
        keys: ["appPreference", "request"],
      },
      {
        message: "Actually, I think a website would be enough.",
        reply: /review.*suggested project details|confirm.*proposed change/i,
        keys: ["appPreference", "websitePreference"],
      },
    ],
  },
  {
    id: "off-topic-recovery",
    turns: [
      {
        message: "Write me a poem about the ocean.",
        reply: /technology|workflows/i,
        facts: false,
      },
      {
        message: "I want a personal website for my photography work.",
        reply: /review.*suggested project details|confirm.*proposed change/i,
        keys: ["goals"],
      },
    ],
  },
  {
    id: "historical-and-hypothetical",
    turns: [
      {
        message: "I used to use WhatsApp for bookings.",
        reply: /current|today/i,
        facts: false,
      },
      {
        message: "Would WhatsApp work for bookings?",
        reply: /\?/i,
        facts: false,
      },
    ],
  },
  {
    id: "ambiguous-reference",
    turns: [
      {
        message: "What would the second one involve?",
        reply: /which two approaches/i,
        facts: false,
      },
    ],
  },
];
export async function conversationEvaluation() {
  const provider = new MockProvider();
  const results = [];
  for (const scenario of scenarios) {
    const history: { role: string; content: string }[] = [];
    let answers: Answers = {};
    const turns = [];
    for (const turn of scenario.turns) {
      const output = await provider.infer(
        answers,
        turn.message,
        history,
        "conversation",
        { plan: planDiscovery(answers) },
      );
      const failures = [];
      if (!turn.reply.test(output.reply))
        failures.push("Reply did not address the expected intent");
      if ("facts" in turn && !turn.facts && output.proposals.length)
        failures.push("Non-factual turn generated evidence");
      if (
        "keys" in turn &&
        turn.keys?.some((key) => !output.proposals.some((p) => p.key === key))
      )
        failures.push("Missing expected proposal");
      // Simulate explicit acceptance for memory tests; database lifecycle has separate integration coverage.
      answers = {
        ...answers,
        ...Object.fromEntries(output.proposals.map((p) => [p.key, p.value])),
      };
      history.push(
        { role: "user", content: turn.message },
        { role: "assistant", content: output.reply },
      );
      turns.push({
        message: turn.message,
        reply: output.reply,
        proposals: output.proposals,
        passed: !failures.length,
        failures,
      });
    }
    const readiness = planDiscovery(answers).readiness.canAssess;
    const readyPassed = !("ready" in scenario) || readiness === scenario.ready;
    results.push({
      id: scenario.id,
      passed: turns.every((t) => t.passed) && readyPassed,
      readyPassed,
      turns,
    });
  }
  return {
    kind: "deterministic multi-turn expectations; live model quality unverified",
    scenarios: results,
  };
}
