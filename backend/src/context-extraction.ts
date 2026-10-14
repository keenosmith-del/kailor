import type {
  Answers,
  ChatOutput,
  DiscoveryContext,
  Evidence,
} from "../../shared/src/index.js";

import { evaluateInput, usableAnswers } from "./input-quality.js";
import {
  claimsFromText,
  clausesOf,
  applyResolvedFacets,
  currentCorrections,
} from "./knowledge-conflicts.js";

// Extraction is separate from quality and reply generation. Clauses retain negation and modality.
export function extractCandidates(message: string): ChatOutput["proposals"] {
  if (!evaluateInput(message, "", "chat").usableFacts) return [];
  const result = new Map<string, string | string[]>();
  const add = (key: string, value: string | string[]) => {
    if (Array.isArray(value))
      result.set(key, [
        ...new Set([
          ...(Array.isArray(result.get(key))
            ? (result.get(key) as string[])
            : []),
          ...value,
        ]),
      ]);
    else if (!result.has(key)) result.set(key, value);
  };
  const current = clausesOf(message).filter(
    (c) =>
      !/\b(?:might|maybe|hypothetically|whether|if I|used to|thinking about)\b/i.test(
        c,
      ),
  );
  const text =
    current.length === clausesOf(message).length
      ? message.trim()
      : current.join(". ");
  if (!text) return [];
  if (/\b(?:I am|I'm|I run|I own|we run|we are|I coordinate)\b/i.test(text))
    add("industry", text);
  const claims = claimsFromText(text, "chat");
  if (
    claims.some((c) =>
      claims.some((x) => x.facet === c.facet && x.value !== c.value),
    )
  )
    return [];
  for (const [facet, key] of [
    ["website", "websiteStatus"],
    ["booking", "bookingStatus"],
    ["ai", "aiPreference"],
    ["automation", "automationPreference"],
    ["websitePreference", "websitePreference"],
  ] as const) {
    const values = [
      ...new Set(claims.filter((c) => c.facet === facet).map((c) => c.value)),
    ];
    if (values.length === 1) add(key, values[0]);
  }
  const presence: string[] = [];
  if (
    /\b(?:use|advertise|only|through|via|on)\b[^.!?]*\binstagram\b/i.test(text)
  )
    presence.push("instagram");
  if (claims.some((c) => c.facet === "website" && c.value === "existing"))
    presence.push("website");
  if (/nowhere online/i.test(text)) presence.push("none");
  if (presence.length)
    add(
      "presence",
      presence.includes("none") && presence.length > 1
        ? presence.filter((p) => p !== "none")
        : presence,
    );
  if (
    /\b(?:use|using|through|via|spreadsheets?|whatsapp|booking system|booking platform|existing software)\b/i.test(
      text,
    )
  )
    add("tools", text);
  const problems: string[] = [];
  const goalClauses: string[] = [];
  for (const clause of current) {
    if (
      /\b(?:don't|do not|no) (?:want|need)\b/i.test(clause) &&
      !/\b(?:but|however)\b/i.test(clause)
    )
      continue;
    if (
      /portfolio|professional presence|credible gallery|showcase|present.*work|website for.*(?:photography|work|business)/i.test(
        clause,
      )
    )
      problems.push("credibility");
    if (
      /manual bookings?|bookings? manually|appointments? (?:through|via)|easier.*book|manage.*appointments?|booking.*(?:difficult|friction|cancellations?|missed)|appointments?.*(?:difficult|missed)|customer reminders/i.test(
        clause,
      )
    )
      problems.push("booking");
    if (
      /invoic/i.test(clause) &&
      /repetitive|copy|manual|spreadsheet|reduce|duplicate|every week|weekly|several hours|automat/i.test(
        clause,
      )
    )
      problems.push("invoices");
    if (
      /recurring|weekly|repeated|research|draft|lesson plan|publishing/i.test(
        clause,
      ) &&
      /content|research|lesson|draft|publication|publishing/i.test(clause)
    )
      problems.push("content");
    if (
      /(?:I need|I want|we need|we want).*?(?:web application|mobile application|mobile app|web app|app for|application that)/i.test(
        clause,
      )
    ) {
      problems.push("custom");
      add("request", clause);
    }
    if (
      /(?:I want|I need|we want|we need|goal|mostly want|wants to)/i.test(
        clause,
      )
    )
      if (
        !/^(?:I|we) (?:want|need)(?: something| it)? (?:affordable|cheap|inexpensive|simple|a small amount|a limited budget|quickly|soon|privacy)/i.test(
          clause,
        ) ||
        /\bto (?:build|improve|automate|record|manage|reduce)\b/i.test(clause)
      ) {
        add("goals", clause);
        goalClauses.push(clause);
      }
    if (
      /manually|repetitive|several hours|current process|copy .*invoic/i.test(
        clause,
      )
    )
      add("workflowDetails", clause);
  }
  if (goalClauses.length > 1) result.set("goals", text);
  if (problems.length) add("problems", problems);
  if (
    /affordable|limited budget|small amount|only spend|can't afford|cannot afford|don't want|do not want|privacy|accessibility|not complicated|no pupil data|review|approval/i.test(
      text,
    )
  )
    add("constraints", text);
  if (
    /budget|only spend|small amount|affordable|can't afford|cannot afford/i.test(
      text,
    )
  )
    add("budget", text);
  if (
    result.size === 0 &&
    /\b(?:want|need|improve|reduce|coordinate|record|build)\b/i.test(text)
  )
    add("clarification", text);
  // A real requirement can also supply the situation without inventing an industry classification.
  if (
    !result.has("industry") &&
    (result.has("workflowDetails") ||
      (result.has("goals") &&
        /for |workflow|application|inspection|build|portfolio/i.test(text)))
  )
    add("clarification", text);
  return [...result].slice(0, 8).map(([key, value]) => ({ key, value }));
}

export function signalAnswers(a: Answers, includeDetails = true): Answers {
  a = usableAnswers(a);
  const result = { ...a };
  // Only current independent confirmed descriptions: pruned detail branches cannot reactivate themselves.
  const roots = [
    "industry",
    "idea",
    "request",
    "frustrations",
    "goals",
    "tools",
    "constraints",
    "portfolio",
    "clarification",
  ];
  if (includeDetails)
    roots.push(
      "bookingDetails",
      "invoiceDetails",
      "contentDetails",
      "scopeDetails",
      "workflowDetails",
    );
  for (const key of roots) {
    if (typeof a[key] !== "string" || !a[key]) continue;
    for (const p of extractCandidates(String(a[key]))) {
      if (p.key === "industry" || p.key === "constraints" || p.key === "budget")
        continue;
      if (p.key in a) continue; // An explicit selection (including skip/none) always wins.
      if (Array.isArray(p.value))
        result[p.key] = [
          ...new Set([
            ...(Array.isArray(result[p.key])
              ? (result[p.key] as string[])
              : []),
            ...p.value,
          ]),
        ];
      else if (!(p.key in result)) result[p.key] = p.value;
    }
  }
  return result;
}

export function buildContext(
  a: Answers,
  evidence: Evidence[] = [],
): DiscoveryContext {
  a = usableAnswers(a);
  const signals = applyResolvedFacets(signalAnswers(a), evidence);
  const corrections = currentCorrections(a, evidence);
  const activity = String(
    a.industry ??
      a.idea ??
      a.request ??
      a.workflowDetails ??
      a.clarification ??
      a.frustrations ??
      a.goals ??
      "",
  );
  const text = Object.values(a).flat().join(" ");
  const unknowns = ["constraints", "budget", "tools"].filter(
    (k) => !(k in a) && !(k in signals),
  );
  return {
    subjectType: String(a.kind ?? "unknown"),
    stage: String(a.stage ?? "unknown"),
    activity: corrections.length
      ? `Earlier description: ${activity}. Current corrections: ${corrections.map((c) => `${c.facet} ${c.currentValue}`).join("; ")}`
      : activity,
    corrections,
    facts: Object.entries(a)
      .filter(([, value]) => String(value).trim())
      .map(([key, value]) => ({
        key,
        value,
        origin: "user-confirmed",
        evidenceIds: evidence
          .filter((e) => e.active && e.status === "confirmed" && e.key === key)
          .map((e) => e.id),
      })),
    preferences: ["constraints", "budget", "timing"]
      .filter((k) => a[k])
      .map((key) => ({ key, value: a[key] })),
    possibilities: Object.entries(signals)
      .filter(([key]) => !(key in a))
      .map(([key, value]) => ({
        key,
        value,
        origin: "rule-inferred",
        reason:
          "Language signal in a confirmed description; not a confirmed field",
        sourceKeys: Object.entries(a)
          .filter(
            ([, v]) =>
              typeof v === "string" &&
              extractCandidates(v).some((p) => p.key === key),
          )
          .map(([k]) => k),
      })),
    pending: evidence
      .filter((e) => e.active && e.status === "inferred")
      .map((e) => ({ key: e.key, value: e.value, origin: e.source })),
    objectives: ["goals", "idea", "request", "frustrations"]
      .filter((k) => a[k])
      .map((key) => ({ key, value: a[key] })),
    workflows: [
      "tools",
      "bookingDetails",
      "invoiceDetails",
      "contentDetails",
      "workflowDetails",
    ]
      .filter((k) => a[k])
      .map((key) => ({ key, value: a[key] })),
    confirmedRequirements: ["request", "scopeDetails", "constraints"]
      .filter((k) => a[k])
      .map((key) => ({ key, value: a[key] })),
    unknowns,
    directions: Array.isArray(signals.problems)
      ? signals.problems.filter((p) => p !== "none")
      : [],
    website: {
      supplied: String(a.websiteUrl ?? ""),
      syntaxValidated: !!a.websiteUrl,
      fetched: false,
      inspected: false,
    },
    specialistReview:
      /\b(?:medical|legal|manufactur|fleet|logistics|regulated|industrial|diagnos)\b/i.test(
        text,
      ),
  };
}
