import type {
  Answers,
  DiscoveryPlan,
  Evidence,
  Question,
} from "../../shared/src/index.js";
import { activeQuestions, version } from "./discovery.js";
import { buildContext, signalAnswers } from "./context-extraction.js";
import { evaluateReadiness } from "./discovery-readiness.js";
import { recommend } from "./assessment.js";
import { matchCases, type CaseRecord } from "./library.js";

export function planDiscovery(
  a: Answers,
  revision = 0,
  evidence: Evidence[] = [],
  cases: CaseRecord[] = [],
): DiscoveryPlan {
  const s = signalAnswers(a),
    context = buildContext(a, evidence);
  const matches = matchCases(a, cases);
  const readiness = evaluateReadiness(a, recommend(a).length);
  const definitions = activeQuestions(s).map((q) =>
    q.id === "scopeDetails" &&
    /teacher|lesson|curriculum/i.test(String(s.request))
      ? {
          ...q,
          title: "How should teachers create and review a weekly plan?",
          hint: "Intended users, approved curriculum/templates, human approval, storage/export and the smallest useful version. Is content generation needed?",
        }
      : q.id === "workflowDetails"
        ? {
            ...q,
            title: "Walk us through the process you want to improve.",
            hint: "What happens today, where does it break down, who uses it, and which records or systems must stay? Include volume and reporting needs.",
          }
        : q,
  );
  const candidates = definitions.filter((q) => !(q.id in a));
  const ranking = candidates
    .map((q) => {
      let score = 0;
      const reasons: string[] = [];
      const rank = (value: number, reason: string) => {
        score += value;
        reasons.push(reason);
      };
      if (q.id === "stage") rank(1000, "Select the starting context");
      if (q.id === "request" && a.stage === "specific")
        rank(900, "Describe the exact requirement before business details");
      if (q.id === "idea" && a.stage === "starting")
        rank(900, "Clarify the idea without assuming existing operations");
      if (q.id === "frustrations" && a.stage === "uncertain")
        rank(900, "Clarify the situation in plain language");
      if (q.id === "industry" && !context.activity)
        rank(800, "Situation is missing");
      if (
        [
          "bookingDetails",
          "invoiceDetails",
          "contentDetails",
          "scopeDetails",
        ].includes(q.id) ||
        (q.id === "workflowDetails" &&
          !context.directions.length &&
          (!!s.goals ||
            !!s.frustrations ||
            /maintenance|inspect|repair|fleet|manufactur|logistics|process|workflow|operational/i.test(
              Object.values(a).flat().join(" "),
            )))
      )
        rank(700, "Workflow evidence changes solution selection");
      if (q.id === "scopeDetails")
        rank(
          80,
          "Application audience and scope precede supporting workflow details",
        );
      if (q.id === "constraints")
        rank(650, "Constraints affect complexity and suitability");
      if (q.id === "goals" && !s.goals && !s.request && !s.frustrations)
        rank(680, "A practical outcome is missing");
      if (q.id === "problems" && !s.problems && !s.request)
        rank(
          590,
          "Identify actual friction rather than guessing from industry",
        );
      if (
        q.id === "tools" &&
        !s.tools &&
        !["starting", "specific"].includes(String(a.stage))
      )
        rank(550, "Avoid replacing tools that already work");
      if (
        q.id === "presence" &&
        context.directions.includes("credibility") &&
        !s.presence
      )
        rank(520, "Check existing presentation before proposing a website");
      if (
        q.id === "websiteUrl" &&
        Array.isArray(s.presence) &&
        s.presence.includes("website")
      )
        rank(300, "Capture a supplied URL without claiming an audit");
      if (q.id === "budget")
        rank(
          100,
          "Optional investment range; never required for preliminary analysis",
        );
      if (q.id in s && !(q.id in a)) {
        score = 0;
        reasons.push("Already described indirectly; no repeated question");
      }
      const reference = matches.find(
        (m) =>
          m.pattern.discoveryQuestions?.length &&
          [
            "bookingDetails",
            "invoiceDetails",
            "contentDetails",
            "scopeDetails",
            "workflowDetails",
          ].includes(q.id),
      );
      if (reference && score > 0)
        rank(10, "Approved reference suggests validating this workflow");
      return { id: q.id, score, reasons };
    })
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score || x.id.localeCompare(y.id));
  const top = ranking[0];
  let question = top ? definitions.find((q) => q.id === top.id)! : null;
  // Preliminary analysis is available immediately; only material clarifications remain in the path.
  if (readiness.canAssess && top && top.score < 500) question = null;
  const active: Question[] = definitions.map((q) =>
    q.id === question?.id ? question : q,
  );
  return {
    revision,
    plannerVersion: "adaptive-1",
    question,
    active,
    answered: Object.keys(a).length,
    total: active.length,
    readiness,
    context,
    ranking,
    referenceHints: matches.flatMap((m) =>
      (m.pattern.discoveryQuestions ?? []).slice(0, 1).map((question) => ({
        question,
        source: m.title,
        reason: m.reasons[0],
      })),
    ),
    suggestedPrompts: [
      question
        ? `I'd like to discuss: ${question.title}`
        : "What is the smallest useful first step?",
      context.directions.includes("booking")
        ? "I would like to clarify my booking workflow and constraints."
        : "I want to improve the process without unnecessary complexity.",
    ],
    provenance: {
      source: "deterministic",
      definitionVersion: version,
      caseIds: matches.map((m) => m.id),
    },
  };
}
