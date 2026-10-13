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
import type { Answers } from "../../shared/src/index.js";
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
];
export type Pattern = {
  industry: string;
  problems: string[];
  tools: string[];
  goals: string[];
  patterns: string[];
  discoveryQuestions?: string[];
  constraints?: string[];
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
export function matchCases(a: Answers, cases: CaseRecord[]) {
  const has = (key: string, v: string) =>
    Array.isArray(a[key])
      ? (a[key] as string[]).includes(v)
      : String(a[key] ?? "")
          .toLowerCase()
          .includes(v.toLowerCase());
  return cases
    .filter((c) => c.reviewStatus === "approved")
    .map((c) => {
      const reasons: string[] = [];
      let score = 0;
      for (const p of c.pattern.problems)
        if (has("problems", p)) {
          score += 4;
          reasons.push(`Confirmed challenge: ${p}`);
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
      return { ...c, score, reasons };
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
