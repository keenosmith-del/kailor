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
  allowNotApplicable?: boolean;
  when?: { key: string; values: string[] };
};
export type Evidence = {
  id: string;
  key: string;
  value: AnswerValue;
  status: string;
  source: string;
  active: boolean;
  provenance?: {
    quote?: string;
    confirmedRevision?: number;
    sourceMessageId?: string;
    basis?: string;
    resolves?: Partial<Record<KnowledgeFacet, string>>;
    quality?: InputQuality;
    conflicts?: DiscoveryConflict[];
    retiredReason?: string;
  };
};
export type Session = {
  id: string;
  revision: number;
  knowledgeRevision?: number;
  definitionVersion: string;
  synthetic: boolean;
  subject: { name: string };
  planId?: string;
  plan?: {
    id: string;
    title: string;
    description: string;
    archivedAt: string | null;
    revision: number;
  };
  planProposals?: PlanProposal[];
  answers: {
    questionId: string;
    value: AnswerValue;
    skipped: boolean;
    responseState?: AnswerState;
    quality?: InputQuality;
  }[];
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
    approvalStatus?: string;
    reviewVersion?: number;
    sourceRunId?: string | null;
    outcomeVerification?: "unverified";
    limitations?: string[];
    usefulness?: string;
  }[];
};
export const turnIntent = z.enum([
  "greeting",
  "description",
  "question",
  "comparison",
  "recommendation",
  "assessment",
  "correction",
  "summary",
  "new_plan",
  "plan_switch",
  "cross_plan_comparison",
  "off_topic",
]);
export const chatOutputSchema = z
  .object({
    reply: z.string().min(1).max(3000),
    intent: turnIntent.optional(),
    planProposal: z
      .object({
        title: z.string().trim().min(1).max(150),
        quote: z.string().min(1).max(1000),
      })
      .strict()
      .optional(),
    followUp: z
      .object({
        questionId: z.string().max(80),
        title: z.string().min(10).max(200),
        hint: z.string().min(10).max(500),
      })
      .strict()
      .optional(),
    proposals: z
      .array(
        z
          .object({
            key: z.string().max(80),
            value: answerValue,
            quote: z.string().min(1).max(4000).optional(),
            basis: z.enum(["explicit", "inferred"]).optional(),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();
export type ChatOutput = z.infer<typeof chatOutputSchema>;
export const mutationSchema = z.object({
  revision: z.number().int().nonnegative(),
});
export const evidenceReviewInput = mutationSchema
  .extend({ accept: z.boolean(), value: answerValue.optional() })
  .strict();
export const answerInput = mutationSchema
  .extend({
    questionId: z.string().max(80),
    value: answerValue,
    skip: z.boolean().optional(),
    responseState: z
      .enum(["answered", "unknown", "not_applicable", "skipped"])
      .optional(),
    resolveConflicts: z.boolean().optional(),
  })
  .strict();
export const chatInput = mutationSchema
  .extend({
    message: z.string().trim().min(1).max(4000),
    mode: z.enum(["conversation", "analysis"]).default("conversation"),
  })
  .strict();

export type ContextDimension =
  | "ordering"
  | "data_capture"
  | "communication"
  | "scheduling"
  | "collaboration"
  | "approvals"
  | "reporting"
  | "automation"
  | "presentation"
  | "application"
  | "offline";
export type ContextStatement = {
  text: string;
  sourceKey: string;
  evidenceIds: string[];
  status:
    | "confirmed-description"
    | "hypothetical"
    | "unverified"
    | "superseded";
  dimensions: ContextDimension[];
};
export type DiscoveryContext = {
  statements?: ContextStatement[];
  dimensions?: ContextDimension[];
  currentProcess?: ContextStatement[];
  desiredProcess?: ContextStatement[];
  capabilities?: ContextStatement[];
  limitations?: ContextStatement[];
  technicalRequirements?: ContextStatement[];
  openQuestions?: string[];

  subjectType: string;
  stage: string;
  activity: string;
  facts: {
    key: string;
    value: AnswerValue;
    origin: "user-confirmed";
    evidenceIds: string[];
  }[];
  preferences: { key: string; value: AnswerValue }[];
  possibilities: {
    key: string;
    value: AnswerValue;
    origin: "rule-inferred";
    reason: string;
    sourceKeys: string[];
  }[];
  pending: { key: string; value: AnswerValue; origin: string }[];
  objectives: { key: string; value: AnswerValue }[];
  workflows: { key: string; value: AnswerValue }[];
  confirmedRequirements: { key: string; value: AnswerValue }[];
  unknowns: string[];
  directions: string[];
  website: {
    supplied: string;
    syntaxValidated: boolean;
    fetched: false;
    inspected: false;
  };
  specialistReview: boolean;
  corrections: {
    facet: KnowledgeFacet;
    currentValue: string;
    sourceEvidenceId: string;
    previousKeys: string[];
  }[];
};
export type Readiness = {
  state:
    | "needs_information"
    | "preliminary"
    | "deeper"
    | "available_with_uncertainties";
  canAssess: boolean;
  reasons: string[];
  uncertainties: string[];
  criticalUnknowns?: string[];
  evidenceDirections?: EvidenceDirection[];
};
export type DiscoveryPlan = {
  revision: number;
  plannerVersion: string;
  question: Question | null;
  questionHistory?: {
    revision: number;
    question: Question;
    source: string;
    caseIds: string[];
  }[];
  active: Question[];
  answered: number;
  total: number;
  readiness: Readiness;
  completion: Completion;
  conflicts: DiscoveryConflict[];
  answerStates: AnswerStates;
  questionStates: Record<
    string,
    AnswerState | "not_presented" | "awaiting_answer" | "irrelevant"
  >;
  context: DiscoveryContext;
  ranking: { id: string; score: number; reasons: string[] }[];
  referenceHints: { question: string; source: string; reason: string }[];
  suggestedPrompts: string[];
  provenance: {
    source: "deterministic";
    generation?: {
      provider: string;
      questionId: string;
      sourceRevision: number;
      sourceMessageId: string;
      validation: "passed";
    };
    definitionVersion: string;
    caseIds: string[];
  };
};

export const evidenceBatchInput = mutationSchema
  .extend({
    ids: z
      .array(z.uuid())
      .min(1)
      .max(8)
      .refine((ids) => new Set(ids).size === ids.length),
    accept: z.boolean(),
  })
  .strict();

export type InputDisposition =
  | "accepted"
  | "accepted_incomplete"
  | "clarification_required"
  | "rejected_placeholder"
  | "rejected_invalid"
  | "off_topic"
  | "conflict_detected";
export type InputQuality = {
  disposition: InputDisposition;
  issues: string[];
  accepted: boolean;
  usableFacts: boolean;
  clarificationRequired: boolean;
  explanation: string;
  recovery:
    | "correct_input"
    | "clarify"
    | "confirm_correction"
    | "continue"
    | "return_to_discovery";
};
export type AnswerState = "answered" | "unknown" | "not_applicable" | "skipped";
export type AnswerStates = Record<string, AnswerState>;
export type KnowledgeFacet =
  | "website"
  | "booking"
  | "ai"
  | "automation"
  | "websitePreference"
  | "appPreference";
export type FactClaim = {
  facet: KnowledgeFacet;
  value: string;
  key: string;
  quote: string;
};
export type DiscoveryConflict = {
  id: string;
  facet: KnowledgeFacet | "scope_budget";
  kind: "contradiction" | "correction" | "tradeoff";
  previous: FactClaim;
  proposed: FactClaim;
  message: string;
  material: boolean;
};
export type EvidenceDirection = {
  id: string;
  services: string[];
  sourceKeys: string[];
  basis: "explicit" | "interpreted";
  limitations: string[];
};
export type EvidenceDecision = {
  answers: Answers;
  directions: EvidenceDirection[];
  conflicts: DiscoveryConflict[];
  unknowns: string[];
  situationKnown: boolean;
  objectiveKnown: boolean;
  unsupported: boolean;
  reasons: string[];
};
export type Completion = {
  state:
    | "in_progress"
    | "clarification_required"
    | "preliminary_available"
    | "deeper_available"
    | "exhausted"
    | "unsupported";
  reasons: string[];
  recoveryQuestion: Question | null;
};

export const planCreateInput = z
  .object({
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().max(1000).default(""),
    creationKey: z.uuid(),
  })
  .strict();
export const planUpdateInput = mutationSchema
  .extend({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(1000).optional(),
    archived: z.boolean().optional(),
  })
  .strict();
export const preferenceInput = mutationSchema
  .extend({
    key: z.enum(["communicationStyle", "implementationPreference"]),
    value: z
      .enum([
        "plain-language",
        "technical-detail",
        "existing-tools-first",
        "custom-when-justified",
      ])
      .nullable(),
  })
  .strict()
  .refine(
    (p) =>
      p.value === null ||
      (p.key === "communicationStyle"
        ? ["plain-language", "technical-detail"]
        : ["existing-tools-first", "custom-when-justified"]
      ).includes(p.value),
    "Choose a value for this preference",
  );
export type PlanItem = {
  lastSessionId: string | null;
  id: string;
  title: string;
  description: string;
  archivedAt: string | null;
  revision: number;
  updatedAt: string;
  sessions: {
    id: string;
    updatedAt: string;
    knowledgeRevision: number;
    synthetic: boolean;
  }[];
  _count?: { sessions: number };
};
export type PlansResponse = {
  plans: PlanItem[];
  selection: { activePlanId: string | null; revision: number };
  nextCursor: string | null;
};
export type Preference = { key: string; value: string; revision: number };
export type PlanProposal = {
  id: string;
  title: string;
  description: string;
  kind: string;
  sourceMessageId: string;
  status: string;
};
export type MemoryExcerpt = {
  sourceMessageId: string;
  role: string;
  ordinal: number;
  text: string;
  category: "alternative" | "question" | "decision" | "discussion";
  temporal: "current-or-discussed" | "historical-or-planned" | "superseded";
  truncated: boolean;
};
export type PersonalMemory = {
  planId: string;
  sessionId: string;
  summary?: {
    id: string;
    version: number;
    knowledgeRevision: number;
    throughOrdinal: number;
    entries: MemoryExcerpt[];
  };
  retrieved: { role: string; content: string; id: string }[];
  preferences: Preference[];
};
export type PlanUnderstanding = {
  plan: { id: string; title: string; archivedAt: string | null };
  sessions: { id: string; updatedAt: string }[];
  confirmed: { key: string; value: AnswerValue; evidenceIds: string[] }[];
  pending: Evidence[];
  readiness: Readiness;
  corrections: DiscoveryContext["corrections"];
  summary: PersonalMemory["summary"] | null;
  unknowns: string[];
};
