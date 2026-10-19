import { z } from "zod";
export type ConsultingFact = {
  id: string;
  label: string;
  value: string;
  sourceKey: string;
  quote: string;
  kind:
    | "goal"
    | "interest"
    | "experience"
    | "constraint"
    | "resource"
    | "fact"
    | "problem";
};
export type ConsultingDirection = {
  id: string;
  title: string;
  summary: string;
  basis: string[];
  why: string;
  requirements: string[];
  risks: string[];
  costToTest: string;
  firstStep: string;
  validation: { kind: string; action: string }[];
  continueWhen: string;
  stopWhen: string;
  commitment: string;
  timeDemand: string;
  status: "hypothesis" | "selected" | "developing" | "rejected" | "deferred";
};
export const canvasStateSchema = z
  .object({
    edits: z
      .record(
        z.string().max(100),
        z
          .object({
            title: z.string().trim().min(2).max(100).optional(),
            notes: z.string().trim().max(1200).optional(),
            capabilities: z
              .array(
                z
                  .object({
                    id: z.uuid(),
                    label: z.string().trim().min(2).max(150),
                    priority: z.enum([
                      "essential",
                      "optional",
                      "deferred",
                      "unconfirmed",
                    ]),
                  })
                  .strict(),
              )
              .max(30)
              .optional(),
            priority: z
              .enum(["essential", "optional", "deferred", "unconfirmed"])
              .optional(),
            decision: z
              .enum([
                "selected",
                "developing",
                "rejected",
                "deferred",
                "exploring",
              ])
              .optional(),
          })
          .strict(),
      )
      .refine(
        (value) => Object.keys(value).length <= 100,
        "Too many Canvas refinements",
      )
      .default({}),
    selections: z
      .record(
        z.string().max(100),
        z
          .object({
            selected: z.boolean(),
            basisRevision: z.number().int().nonnegative(),
            updatedAt: z.iso.datetime(),
          })
          .strict(),
      )
      .refine((v) => Object.keys(v).length <= 100, "Too many selections")
      .optional(),
    additions: z
      .array(
        z
          .object({
            id: z.uuid(),
            kind: z.enum(["idea", "constraint", "decision"]),
            title: z.string().trim().min(2).max(100),
            notes: z.string().trim().min(2).max(1200),
          })
          .strict(),
      )
      .max(30)
      .default([]),
  })
  .strict();
export type CanvasState = z.infer<typeof canvasStateSchema>;
export const emptyCanvasState = (): CanvasState => ({
  edits: {},
  additions: [],
});
export type RequirementPriority =
  | "essential"
  | "optional"
  | "deferred"
  | "unconfirmed";
export type ProjectRequirement = {
  id: string;
  label: string;
  priority: RequirementPriority;
  conflict?: string;
  provenance: {
    sourceKey: string;
    quote: string;
    basis: "explicit" | "interpreted";
  }[];
};
export type ConsultingBrief = {
  relationship?: "complementary" | "alternatives";
  requirements?: ProjectRequirement[];
  insights?: { title: string; summary: string }[];
  approaches?: {
    title: string;
    strengths: string;
    tradeoffs: string;
    appropriateWhen: string;
  }[];
  version: 1;
  summary: string;
  facts: ConsultingFact[];
  directions: ConsultingDirection[];
  conclusions: string[];
  hypotheses: string[];
  unknowns: string[];
  decisions: { title: string; notes: string; status: string }[];
};
