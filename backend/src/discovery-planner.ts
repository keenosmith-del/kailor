import type {
  Answers,
  DiscoveryPlan,
  Evidence,
  Question,
  AnswerStates,
} from "../../shared/src/index.js";
import { activeQuestions, version } from "./discovery.js";
import { buildContext, signalAnswers } from "./context-extraction.js";
import { evaluateReadiness } from "./discovery-readiness.js";
import { evaluateEvidence } from "./evidence-policy.js";
import { usableAnswers, inferResponseState } from "./input-quality.js";
import { matchCases, type CaseRecord } from "./library.js";

export function planDiscovery(
  a: Answers,
  revision = 0,
  evidence: Evidence[] = [],
  cases: CaseRecord[] = [],
  states: AnswerStates = {},
): DiscoveryPlan {
  const raw = a;
  states = {
    ...Object.fromEntries(
      Object.entries(a).map(([k, v]) => [k, inferResponseState(v, v === "")]),
    ),
    ...states,
  };
  a = usableAnswers(raw, states);
  const decision = evaluateEvidence(raw, evidence, states);
  const s = decision.answers,
    context = buildContext(a, evidence);
  const matches = matchCases(raw, cases, evidence, states);
  const readiness = evaluateReadiness(raw, evidence, states);
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
  const candidates = definitions.filter((q) => !(q.id in raw));
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
      if (q.id === "industry" && !decision.situationKnown)
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
          (decision.situationKnown ||
            !!raw.frustrations ||
            !!s.goals ||
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
      if (
        q.id === "clarification" &&
        (!decision.situationKnown ||
          !decision.objectiveKnown ||
          !decision.directions.length)
      )
        rank(
          760,
          "A concrete example is needed; clarify rather than inventing a requirement",
        );
      if (
        q.id === "workflowDetails" &&
        (raw.frustrations || raw.goals) &&
        !decision.directions.length
      )
        rank(
          160,
          "Investigate the incomplete outcome using a concrete current process",
        );
      if (q.id === "constraints" && decision.directions.length)
        rank(650, "Constraints affect complexity and suitability");
      if (q.id === "goals" && !decision.objectiveKnown)
        rank(680, "A practical outcome is missing");
      if (q.id === "problems" && !s.problems && !s.request)
        rank(
          590,
          "Identify actual friction rather than guessing from industry",
        );
      if (
        q.id === "tools" &&
        !s.tools &&
        !["starting", "specific"].includes(String(a.stage)) &&
        decision.directions.length > 0
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
  if (decision.conflicts.length || decision.unsupported) question = null;
  const recoveryQuestion: Question = {
    id: "clarification",
    title: decision.unsupported
      ? "Is there an administrative workflow we can investigate safely?"
      : "What is one concrete task or outcome we should understand?",
    hint: context.activity
      ? `I have your context: ${context.activity.slice(0, 180)}. Describe what happens today and what should change.`
      : "Describe a real activity, the current steps, who is involved and the outcome you want.",
    type: "text",
    optional: true,
  };
  const completion: DiscoveryPlan["completion"] = {
    state: decision.unsupported
      ? "unsupported"
      : readiness.canAssess
        ? readiness.state === "deeper"
          ? "deeper_available"
          : "preliminary_available"
        : decision.conflicts.length
          ? "clarification_required"
          : question
            ? decision.situationKnown
              ? "clarification_required"
              : "in_progress"
            : "exhausted",
    reasons: readiness.reasons,
    recoveryQuestion,
  };
  const active: Question[] = definitions.map((q) =>
    q.id === question?.id ? question : q,
  );
  return {
    revision,
    plannerVersion: "reliability-2",
    question,
    active,
    answered: Object.keys(a).filter((k) => states[k] === "answered").length,
    total: active.length,
    readiness,
    completion,
    conflicts: decision.conflicts,
    answerStates: states,
    questionStates: Object.fromEntries(
      [...activeQuestions({}), ...definitions].map((q) => [
        q.id,
        states[q.id] ??
          (q.id === question?.id ? "awaiting_answer" : "not_presented"),
      ]),
    ),
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
