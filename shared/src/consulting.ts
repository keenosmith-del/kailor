import { z } from "zod";
export type ConsultingFact = {
  id: string;
  label: string;
  value: string;
  sourceKey: string;
  quote: string;
  kind: "goal" | "interest" | "experience" | "constraint" | "resource";
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
  status: "hypothesis" | "selected" | "rejected" | "deferred";
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
            decision: z
              .enum(["selected", "rejected", "deferred", "exploring"])
              .optional(),
          })
          .strict(),
      )
      .refine(
        (value) => Object.keys(value).length <= 100,
        "Too many Canvas refinements",
      )
      .default({}),
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
export type ConsultingBrief = {
  version: 1;
  summary: string;
  facts: ConsultingFact[];
  directions: ConsultingDirection[];
  conclusions: string[];
  hypotheses: string[];
  unknowns: string[];
  decisions: { title: string; notes: string; status: string }[];
};
