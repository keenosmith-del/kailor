import { z } from "zod";
export const answerValue = z.union([
  z.string().max(4000),
  z.array(z.string().max(200)).max(20),
]);
export type AnswerValue = z.infer<typeof answerValue>;
export type Answers = Record<string, AnswerValue>;
export type Question = {
  id: string;
  title: string;
  hint: string;
  type: "single" | "multi" | "text";
  options?: { value: string; label: string }[];
  optional?: boolean;
  when?: { key: string; values: string[] };
};
export type Evidence = {
  id: string;
  key: string;
  value: AnswerValue;
  status: string;
  source: string;
  active: boolean;
};
export type Session = {
  id: string;
  revision: number;
  definitionVersion: string;
  synthetic: boolean;
  subject: { name: string };
  answers: { questionId: string; value: AnswerValue; skipped: boolean }[];
  messages: { id: string; role: string; content: string; provider: string }[];
  evidence: Evidence[];
};
export type Recommendation = {
  serviceId: string;
  problem: string;
  solution: string;
  evidence: string[];
  benefits: string[];
  alternatives: string[];
  complexity: string;
  dependencies: string[];
  confidence: string;
  delivery: string;
  nextSteps: string[];
  optional: boolean;
  estimate: {
    status: string;
    currency: string;
    implementationLow: number | null;
    implementationHigh: number | null;
    recurringStatus: string;
    notes: string;
  };
};
export type ReportSection = { title: string; paragraphs: string[] };
export type Report = {
  title: string;
  status: string;
  synthetic: boolean;
  revision: number;
  createdAt: string;
  sections: ReportSection[];
  recommendations: Recommendation[];
  matchedCases: {
    id: string;
    title: string;
    sourceType: string;
    reasons: string[];
  }[];
};
export const chatOutputSchema = z
  .object({
    reply: z.string().min(1).max(3000),
    proposals: z
      .array(z.object({ key: z.string().max(80), value: answerValue }))
      .max(8),
  })
  .strict();
export type ChatOutput = z.infer<typeof chatOutputSchema>;
export const mutationSchema = z.object({
  revision: z.number().int().nonnegative(),
});
export const answerInput = mutationSchema
  .extend({
    questionId: z.string().max(80),
    value: answerValue,
    skip: z.boolean().optional(),
  })
  .strict();
export const chatInput = mutationSchema
  .extend({
    message: z.string().trim().min(1).max(4000),
    mode: z.enum(["conversation", "analysis"]).default("conversation"),
  })
  .strict();
