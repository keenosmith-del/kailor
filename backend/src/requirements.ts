import {
  presenceCapabilities,
  projectIntent,
} from "../../shared/src/project-intent.js";
import type { Answers, AnswerStates } from "../../shared/src/index.js";
import {
  canvasStateSchema,
  type ProjectRequirement,
  type RequirementPriority,
} from "../../shared/src/consulting.js";
import { usableAnswers } from "./input-quality.js";

// Capability identities distinguish related concepts; these are evidence matchers, not vendor claims.
export const capabilityPatterns = [
  ...presenceCapabilities,
  [
    "scheduling",
    "Creation and scheduling",
    /(?:delivery|job|order|appointment|production).{0,25}(?:creat|schedul)|(?:creat|schedul).{0,25}(?:deliver|job|order|appointment|production)/i,
  ],
  ["assignment", "Assignment and reassignment", /assign|dispatch/i],
  [
    "mobile-access",
    "Smartphone access to assigned work",
    /smartphone access|mobile.{0,20}(?:access|job)|(?:driver|staff).{0,30}(?:smartphone|assigned jobs)/i,
  ],
  [
    "status-updates",
    "Staff-updated progress statuses",
    /status(?:es)?|progress updates?/i,
  ],
  [
    "proof",
    "Digital proof of completion",
    /proof of (?:delivery|completion)|digital.{0,15}signature/i,
  ],
  ["dashboard", "Operations dashboard", /dashboard/i],
  ["history", "History and search", /history|search/i],
  ["exports", "CSV exports", /csv|exports?/i],
  [
    "permissions",
    "Role-based access permissions",
    /role.based|permissions?|only see|access (?:control|rights)/i,
  ],
  [
    "privacy",
    "Customer information protection",
    /protect.{0,30}(?:information|data)|privacy|data protection/i,
  ],
  [
    "customer-links",
    "Customer-facing tracking links",
    /(?:customer|secure).{0,25}tracking links?/i,
  ],
  [
    "notifications",
    "Automatic customer notifications",
    /(?:automatic|automated|customer).{0,20}(?:notification|reminder)|(?:notification|reminder).{0,20}(?:customer|automatic)/i,
  ],
  [
    "gps",
    "Continuous GPS location tracking",
    /(?:live|continuous|real.time) gps|gps tracking|continuous.{0,10}(?:location|tracking)/i,
  ],
  ["routing", "Advanced route optimisation", /route optimi[sz]|advanced rout/i],
  [
    "native-app",
    "Dedicated native mobile application",
    /native (?:mobile )?app|dedicated.{0,10}mobile app/i,
  ],
  ["analytics", "Complex analytics", /complex analytics|advanced analytics/i],
  ["inventory", "Inventory management", /inventory|stock control/i],
  ["intake", "Client intake", /client intake|customer intake/i],
  [
    "documents",
    "Document management",
    /document management|document workflow/i,
  ],
  ["quality", "Quality records", /quality (?:control|record|assurance)/i],
] as const;
const explicitPriority = (s: string): RequirementPriority | undefined =>
  /(?:defer|postpon|can wait|useful later|not.*(?:first|initial) version|don['’]t need|do not need|not (?:needed|required)|out of scope|exclud|set aside)/i.test(
    s,
  )
    ? "deferred"
    : /optional|nice.to.have|useful (?:later|but)|later improvement|not essential/i.test(
          s,
        )
      ? "optional"
      : /essential|must|first.phase|first.version|initial.phase|prioriti[sz]|want|would like|need(?:s|ed)?(?: to)?|require(?:d|ment)/i.test(
            s,
          )
        ? "essential"
        : undefined;

export function projectRequirements(
  raw: Answers,
  states: AnswerStates = {},
  workspace: unknown = null,
): ProjectRequirement[] {
  const a = usableAnswers(raw, states);
  const parsed = canvasStateSchema.safeParse(workspace);
  const live = parsed.success ? parsed.data : { edits: {}, additions: [] };
  const intent = projectIntent(Object.values(a).flat().join(" "));
  const result = new Map<string, ProjectRequirement>();
  // Refinements are the latest explicit requirement layer, attributed to Canvas.
  for (const edit of Object.values(live.edits)) {
    if (!edit.notes || !edit.title) continue;
    a[`canvas:${edit.title}`] = edit.notes;
  }
  // Scope answers are the latest explicit prioritisation layer over current descriptions.
  const entries = Object.entries(a).sort(
    ([x, xv], [y, yv]) =>
      Number(/scopeDetails|firstVersion/.test(x)) +
      (/actually|now (?:essential|optional|required)|no longer|changed.*priority/i.test(
        String(xv),
      )
        ? 2
        : 0) -
      (Number(/scopeDetails|firstVersion/.test(y)) +
        (/actually|now (?:essential|optional|required)|no longer|changed.*priority/i.test(
          String(yv),
        )
          ? 2
          : 0)),
  );
  for (const [sourceKey, value] of entries) {
    if (typeof value !== "string" || sourceKey === "stage") continue;
    let sectionPriority: RequirementPriority | undefined =
      /scopeDetails|firstVersion/.test(sourceKey) ? "essential" : undefined;
    for (const quote of value
      .split(/\n+|(?<=[.!?;])\s+|,\s+(?=(?:optional|deferred|essential)\b)/i)
      .map((s) => s.trim())
      .filter(Boolean)) {
      const priority = /what if|maybe|might|not sure|used to/i.test(quote)
        ? undefined
        : explicitPriority(quote);
      if (
        /:\s*$/.test(quote) ||
        /^(?:essential|optional|deferred)\b/i.test(quote)
      )
        sectionPriority = priority;
      const effective = /what if|maybe|might|not sure|used to/i.test(quote)
        ? undefined
        : (priority ?? sectionPriority);
      let matched = false;
      for (const [id, label, signal] of capabilityPatterns) {
        if (
          presenceCapabilities.some(([key]) => key === id) &&
          !intent.website &&
          !intent.social
        )
          continue;
        if (!signal.test(quote)) continue;
        matched = true;
        const item: ProjectRequirement = {
          id: `requirement-${id}`,
          label,
          priority: effective ?? "unconfirmed",
          provenance: [
            { sourceKey, quote, basis: effective ? "explicit" : "interpreted" },
          ],
        };
        const old = result.get(id);
        if (old) {
          item.provenance = [...old.provenance, ...item.provenance];
          if (!effective) item.priority = old.priority;
          else if (
            old.priority !== "unconfirmed" &&
            old.priority !== effective &&
            (!/scopeDetails|firstVersion/.test(sourceKey) ||
              old.provenance.at(-1)?.sourceKey === sourceKey) &&
            !/actually|instead|now|no longer|changed|postpon|can wait|defer/i.test(
              quote,
            )
          ) {
            item.priority = "unconfirmed";
            item.conflict = "Conflicting priorities need your clarification.";
          }
        }
        result.set(id, item);
      }
      // Preserve explicit capabilities outside the recogniser vocabulary as attributed text.
      if (
        !matched &&
        effective &&
        /scopeDetails|firstVersion/.test(sourceKey) &&
        !/:$/.test(quote) &&
        quote.split(/\s+/).length >= 2
      ) {
        const label = quote
          .replace(
            /^\d+[.)]\s*|^(?:essential|optional|deferred)(?: requirements?)?:\s*/gi,
            "",
          )
          .replace(/[.;]+$/, "")
          .trim();
        const id = `other-${label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 65)}`;
        result.set(id, {
          id: `requirement-${id}`,
          label,
          priority: effective,
          provenance: [{ sourceKey, quote, basis: "explicit" }],
        });
      }
    }
  }
  for (const edit of Object.values(live.edits))
    for (const capability of edit.capabilities ?? []) {
      const existing = [...result.values()].find(
        (r) => r.label.toLowerCase() === capability.label.toLowerCase(),
      );
      if (!existing)
        result.set(`user-${capability.id}`, {
          id: `requirement-user-${capability.id}`,
          label: capability.label,
          priority: capability.priority,
          provenance: [
            { sourceKey: "canvas", quote: capability.label, basis: "explicit" },
          ],
        });
    }
  return [...result.values()].map((item) => {
    const edit = live.edits[item.id];
    if (!edit) return item;
    const priority =
      edit.priority ??
      (edit.decision === "deferred" || edit.decision === "rejected"
        ? "deferred"
        : undefined);
    return {
      ...item,
      label: edit.title ?? item.label,
      priority: priority ?? item.priority,
      ...(priority ? { conflict: undefined } : {}),
      provenance: [
        ...item.provenance,
        ...(priority || edit.notes
          ? [
              {
                sourceKey: "canvas",
                quote: edit.notes ?? `Priority changed to ${priority}`,
                basis: "explicit" as const,
              },
            ]
          : []),
      ],
    };
  });
}

export function operationalPattern(a: Answers) {
  if (!["established", "specific"].includes(String(a.stage))) return null;
  const text = Object.values(a).flat().join(" ");
  const intent = projectIntent(text);
  if (intent.prelaunch && !intent.operational) return null;
  // A workflow category needs functional evidence, not an industry name alone.
  const patterns = [
    {
      id: "delivery",
      subject: "Delivery operations",
      platform: "delivery-management platform",
      signal: /dispatch|driver.{0,30}(?:assign|status|job)|proof of delivery/i,
    },
    {
      id: "appointments",
      subject: "Appointment operations",
      platform: "scheduling and reminder service",
      signal: /appointment|booking/i,
    },
    {
      id: "retail",
      subject: "Retail operations",
      platform: "inventory and ordering platform",
      signal: /inventory|stock control|order fulfil/i,
    },
    {
      id: "professional",
      subject: "Client operations",
      platform: "client workflow and document-management platform",
      signal: /client intake|document management/i,
    },
    {
      id: "production",
      subject: "Production operations",
      platform: "production and quality-management platform",
      signal: /production schedul|quality record|quality control/i,
    },
  ];
  return patterns.find((p) => p.signal.test(text)) ?? null;
}
