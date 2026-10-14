import type {
  Answers,
  ChatOutput,
  DiscoveryContext,
  Evidence,
} from "../../shared/src/index.js";

// Narrow, auditable language rules. These are candidates/signals, never database writes.
export function extractCandidates(message: string): ChatOutput["proposals"] {
  const proposals: ChatOutput["proposals"] = [];
  const add = (key: string, value: string | string[]) =>
    proposals.push({ key, value });
  const text = message.trim();
  if (/\b(if I|perhaps|hypothetically|imagine|maybe I)\b/i.test(text))
    return proposals;
  if (/\b(I am|I'm|I run|I own|we run|we are|I coordinate)\b/i.test(text))
    add("industry", text);
  const presence: string[] = [];
  if (/\binstagram|social media\b/i.test(text)) presence.push("instagram");
  if (
    /\b(?:already (?:have|has|use)|have|has|our|my|existing) (?:a |an )?website\b/i.test(
      text,
    ) &&
    !/\b(?:don't|do not|no|not) (?:have |want |need )?(?:a )?website\b/i.test(
      text,
    )
  )
    presence.push("website");
  if (
    /\b(?:no website|don't have a website|do not have a website)\b/i.test(text)
  )
    add("websiteStatus", "absent");
  if (/\bnowhere online\b/i.test(text) && !presence.length)
    presence.push("none");
  if (presence.length) add("presence", presence);
  if (
    /\b(?:use|using|through|via|spreadsheets?|whatsapp|booking system|booking platform|existing software)\b/i.test(
      text,
    )
  )
    add("tools", text);
  const problems: string[] = [];
  if (
    /\b(?:professional presence|portfolio|present (?:my|our) work|credib|gallery|showcase)\b/i.test(
      text,
    ) &&
    !/\b(?:no|don't need|do not need) (?:public )?portfolio\b/i.test(text)
  )
    problems.push("credibility");
  if (
    /\b(?:manual bookings?|bookings? manually|appointments? (?:through|via)|easier.*book|manage.*appointments?|booking.*(?:difficult|friction|cancellations?|missed)|appointments?.*(?:difficult|missed))\b/i.test(
      text,
    )
  )
    problems.push("booking");
  if (
    /\binvoic/i.test(text) &&
    /\b(?:repetitive|copy|manual|spreadsheet|reduce|email|duplicate)\b/i.test(
      text,
    )
  )
    problems.push("invoices");
  if (
    /\b(?:recurring|weekly|repeated|research|draft|lesson plan|publishing)\b/i.test(
      text,
    ) &&
    /\b(?:content|research|lesson|draft|publication|publishing)\b/i.test(text)
  )
    problems.push("content");
  if (
    /\b(?:I need|I want|we need|we want)\b.*\b(?:web application|mobile application|mobile app|web app|app for|application that)\b/i.test(
      text,
    )
  ) {
    problems.push("custom");
    add("request", text);
  }
  if (problems.length) add("problems", problems);
  if (
    /\b(?:I want|I need|we want|we need|goal|mostly want|wants to)\b/i.test(
      text,
    ) &&
    !/^(?:I|we) (?:don't|do not) (?:want|need)/i.test(text)
  )
    add("goals", text);
  if (
    /\b(?:affordable|limited budget|small amount|only spend|can't afford|cannot afford|don't want|do not want|privacy|accessibility|not complicated|no pupil data|review|approval|not applicable)\b/i.test(
      text,
    )
  )
    add("constraints", text);
  if (
    /\b(?:budget|only spend|small amount|affordable|can't afford|cannot afford)\b/i.test(
      text,
    )
  )
    add("budget", text);
  return proposals.slice(0, 8);
}

export function signalAnswers(a: Answers, includeDetails = true): Answers {
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
  const signals = signalAnswers(a);
  const text = Object.values(a).flat().join(" ");
  const unknowns = ["constraints", "budget", "tools"].filter(
    (k) => !(k in a) && !(k in signals),
  );
  return {
    subjectType: String(a.kind ?? "unknown"),
    stage: String(a.stage ?? "unknown"),
    activity: String(a.industry ?? a.idea ?? a.request ?? ""),
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
