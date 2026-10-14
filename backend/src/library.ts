import adaptivePersona0 from "../../data/personas/existing-booking.json" with { type: "json" };
import adaptivePersona1 from "../../data/personas/new-idea.json" with { type: "json" };
import adaptivePersona2 from "../../data/personas/technical-founder.json" with { type: "json" };
import adaptivePersona3 from "../../data/personas/fleet-maintenance.json" with { type: "json" };
import adaptivePersona4 from "../../data/personas/cross-industry-booking.json" with { type: "json" };
import adaptivePersona5 from "../../data/personas/same-industry-portfolio.json" with { type: "json" };
import adaptivePersona6 from "../../data/personas/vague-user.json" with { type: "json" };
import adaptivePersona7 from "../../data/personas/no-website.json" with { type: "json" };
import adaptivePersona8 from "../../data/personas/specialist-review.json" with { type: "json" };
import { z } from "zod";
import { answerValue } from "../../shared/src/index.js";
import nails from "../../data/scenarios/nails.json" with { type: "json" };
import salon from "../../data/scenarios/salon.json" with { type: "json" };
import seller from "../../data/scenarios/seller.json" with { type: "json" };
import food from "../../data/scenarios/food.json" with { type: "json" };
import trades from "../../data/scenarios/trades.json" with { type: "json" };
import creative from "../../data/scenarios/creative.json" with { type: "json" };
import freelancer from "../../data/scenarios/freelancer.json" with { type: "json" };
import consultant from "../../data/scenarios/consultant.json" with { type: "json" };
import teacher from "../../data/scenarios/teacher.json" with { type: "json" };
import fitness from "../../data/scenarios/fitness.json" with { type: "json" };
import invoice from "../../data/scenarios/invoice.json" with { type: "json" };
import appointments from "../../data/scenarios/appointments.json" with { type: "json" };
import social from "../../data/scenarios/social.json" with { type: "json" };
import modernize from "../../data/scenarios/modernize.json" with { type: "json" };
import editorial from "../../data/scenarios/editorial.json" with { type: "json" };
import nailPersona from "../../data/personas/nail-technician.json" with { type: "json" };
import professionalPersona from "../../data/personas/professional.json" with { type: "json" };
import invoicePersona from "../../data/personas/invoice-business.json" with { type: "json" };
import teacherPersona from "../../data/personas/teacher.json" with { type: "json" };
import kaiPersona from "../../data/personas/kai.json" with { type: "json" };
import { evaluateInput, usableAnswers } from "./input-quality.js";
import { evaluateEvidence } from "./evidence-policy.js";
import { signalAnswers } from "./context-extraction.js";
import type {
  Answers,
  Evidence,
  AnswerStates,
} from "../../shared/src/index.js";
export const scenarios = [
  nails,
  salon,
  seller,
  food,
  trades,
  creative,
  freelancer,
  consultant,
  teacher,
  fitness,
  invoice,
  appointments,
  social,
  modernize,
  editorial,
];
export const personas = [
  nailPersona,
  professionalPersona,
  invoicePersona,
  teacherPersona,
  kaiPersona,
  adaptivePersona0,
  adaptivePersona1,
  adaptivePersona2,
  adaptivePersona3,
  adaptivePersona4,
  adaptivePersona5,
  adaptivePersona6,
  adaptivePersona7,
  adaptivePersona8,
];
export type Pattern = {
  industry: string;
  problems: string[];
  tools: string[];
  goals: string[];
  patterns: string[];
  discoveryQuestions?: string[];
  constraints?: string[];
  stage?: string;
  scope?: string[];
  limitations?: string[];
  unsuitableConstraints?: string[];
  unsuitableConditions?: string[];
};
export type CaseRecord = {
  id: string;
  title: string;
  sourceType: string;
  reviewStatus: string;
  pattern: Pattern;
};
export interface CaseRetriever {
  match(answers: Answers, cases: CaseRecord[]): ReturnType<typeof matchCases>;
}
export function matchCases(
  a: Answers,
  cases: CaseRecord[],
  evidence: Evidence[] = [],
  states: AnswerStates = {},
) {
  const decision = evaluateEvidence(a, evidence, states);
  if (decision.conflicts.length || decision.unsupported) return [];
  a = usableAnswers(a, states);
  const confirmed = a;
  a = decision.answers;
  const has = (key: string, v: string) =>
    Array.isArray(a[key])
      ? (a[key] as string[]).includes(v)
      : String(a[key] ?? "")
          .toLowerCase()
          .includes(v.toLowerCase());
  return cases
    .filter(
      (c) =>
        c.reviewStatus === "approved" &&
        evaluateInput(c.title, "caseTitle").usableFacts &&
        evaluateInput(c.pattern.industry, "industry").usableFacts,
    )
    .filter(
      (c) =>
        !(c.pattern.unsuitableConstraints ?? []).some((term) =>
          String(a.constraints ?? "")
            .toLowerCase()
            .includes(term.toLowerCase()),
        ),
    )
    .filter(
      (c) =>
        !(
          c.pattern.patterns.includes("website") &&
          /(?:don.t|do not) (?:want|need) (?:a )?website/i.test(
            String(a.constraints ?? ""),
          )
        ) &&
        !(
          c.pattern.patterns.includes("ai") &&
          /no AI|don.t want AI|do not want AI/i.test(
            String(a.constraints ?? ""),
          )
        ),
    )
    .filter(
      (c) =>
        !(
          c.pattern.patterns.includes("website") &&
          a.websitePreference === "declined"
        ) &&
        !(c.pattern.patterns.includes("ai") && a.aiPreference === "declined"),
    )
    .filter(
      (c) =>
        !(
          a.websiteStatus === "existing" &&
          c.pattern.patterns.every((p) => ["website", "portfolio"].includes(p))
        ),
    )
    .map((c) => {
      const reasons: string[] = [];
      let score = 0;
      for (const p of c.pattern.problems)
        if (has("problems", p)) {
          score += 4;
          reasons.push(
            `${Array.isArray(confirmed.problems) && confirmed.problems.includes(p) ? "Confirmed challenge" : "Described challenge signal (interpretation requires review)"}: ${p}`,
          );
        }
      for (const t of c.pattern.tools)
        if (has("tools", t) || has("presence", t)) {
          score += 2;
          reasons.push(`Existing tool or channel: ${t}`);
        }
      if (
        c.pattern.industry !== "cross-industry" &&
        has("industry", c.pattern.industry)
      ) {
        score++;
        reasons.push(`Related context: ${c.pattern.industry}`);
      }
      for (const g of c.pattern.goals)
        if (has("goals", g)) {
          score += 2;
          reasons.push(`Related goal: ${g}`);
        }
      for (const constraint of c.pattern.constraints ?? [])
        if (has("constraints", constraint)) {
          score++;
          reasons.push(`Shared constraint: ${constraint}`);
        }
      if (c.pattern.stage && a.stage === c.pattern.stage) {
        score += 2;
        reasons.push(`Shared project stage: ${c.pattern.stage}`);
      }
      for (const term of c.pattern.scope ?? [])
        if (
          has("request", term) ||
          has("scopeDetails", term) ||
          has("workflowDetails", term)
        ) {
          score += 3;
          reasons.push(`Related scope: ${term}`);
        }
      const useful = reasons.some((r) => /challenge|goal|scope/.test(r));
      return {
        ...c,
        score: useful ? score : 0,
        reasons,
        usefulness:
          "Reference questions and alternatives only; current evidence determines suitability",
        limitations: [
          ...(c.pattern.limitations ?? [
            "Self-reported or synthetic pattern; no verified customer outcome",
            "Different tools, constraints and scope may make this pattern unsuitable",
          ]),
          ...(c.pattern.unsuitableConditions ?? []),
        ],
      };
    })
    .filter((c) => c.score >= 4)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 4);
}
export const seededCases: CaseRecord[] = scenarios.map((s) => ({
  id: `seed-${s.id}`,
  title: s.title,
  sourceType: "seed",
  reviewStatus: "approved",
  pattern: s,
}));

export const personaSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().min(1).max(150),
    synthetic: z.literal(true),
    description: z.string().max(1000),
    answers: z
      .record(z.string().max(80), answerValue)
      .refine((a) => Object.keys(a).length <= 30),
    chat: z.array(z.string().max(4000)).max(8),
    expectedServices: z.array(z.string().max(100)).max(20),
    excludedServices: z.array(z.string().max(100)).max(20),
  })
  .strict();
export type SyntheticPersona = z.infer<typeof personaSchema>;
