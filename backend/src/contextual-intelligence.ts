import type {
  Answers,
  AnswerStates,
  ContextDimension,
  ContextStatement,
  Evidence,
  Question,
} from "../../shared/src/index.js";
import { evaluateInput } from "./input-quality.js";
import {
  clausesOf,
  claimsFromText,
  resolvedFacets,
} from "./knowledge-conflicts.js";

// Shared problem dimensions, deliberately independent of industry names.
const dimensions: [ContextDimension, RegExp][] = [
  [
    "data_capture",
    /\brecord\w*|\bcaptur\w*|\binspect\w*|\bforms?\b|data entry|quality control/i,
  ],
  ["communication", /communicat|message|whatsapp|enquir|reminder/i],
  ["scheduling", /\bbook(?:ing|ings)?\b|appointment|schedul|cancellation/i],
  ["collaboration", /team|technician|staff|collaborat|teacher|volunteer/i],
  ["approvals", /approv|sign.off|review/i],
  ["reporting", /report|dashboard|summary|export|audit/i],
  ["automation", /automat|repetitive|copy|manual invoic/i],
  ["presentation", /portfolio|website|showcase|professional presentation/i],
  ["application", /application|\bapp\b|functionality|software product/i],
  [
    "offline",
    /offline|no internet|without (?:an? )?(?:internet|connection)|no connectivity/i,
  ],
];
export function contextualStatements(
  a: Answers,
  evidence: Evidence[] = [],
  states: AnswerStates = {},
): ContextStatement[] {
  const overrides = {
    website: a.websiteStatus,
    booking: a.bookingStatus,
    ai: a.aiPreference,
    automation: a.automationPreference,
    websitePreference: a.websitePreference,
    appPreference: a.appPreference,
    ...resolvedFacets(evidence),
  };
  return Object.entries(a).flatMap(([sourceKey, value]) =>
    typeof value !== "string"
      ? []
      : clausesOf(value).map((text) => ({
          text,
          sourceKey,
          evidenceIds: evidence
            .filter(
              (e) =>
                e.active && e.status === "confirmed" && e.key === sourceKey,
            )
            .map((e) => e.id),
          status:
            states[sourceKey] && states[sourceKey] !== "answered"
              ? ("unverified" as const)
              : claimsFromText(text, sourceKey).some(
                    (c) =>
                      overrides[c.facet] &&
                      overrides[c.facet] !== "unknown" &&
                      overrides[c.facet] !== c.value,
                  )
                ? ("superseded" as const)
                : /\b(?:might|maybe|what if|hypothetical|whether|if I|used to|thinking about)\b/i.test(
                      text,
                    )
                  ? ("hypothetical" as const)
                  : !evaluateInput(text, sourceKey).usableFacts ||
                      /not sure|don.t know|unverified/i.test(text)
                    ? ("unverified" as const)
                    : ("confirmed-description" as const),
          dimensions: dimensions
            .filter(
              ([id, pattern]) =>
                pattern.test(text) &&
                !(
                  id === "offline" &&
                  /(?:don.t|do not|no longer) (?:want|need).*offline|(?:online.only|not offline)/i.test(
                    text,
                  )
                ),
            )
            .map(([id]) => id),
        })),
  );
}
export const contextualQuestions: Question[] = [
  {
    id: "offlineDetails",
    title:
      "What must work without a connection, and what happens when it returns?",
    hint: "Which records, photos or tasks need to be available offline? How should conflicting edits and failed synchronization be handled?",
    type: "text",
    optional: true,
  },
  {
    id: "dataCaptureDetails",
    title: "What needs to be recorded, and how is it recorded today?",
    hint: "A sample record, photos, signatures, validation and the devices people use will help establish the scope.",
    type: "text",
    optional: true,
  },
  {
    id: "accessDetails",
    title:
      "Who will use this, and what should each person be able to see or change?",
    hint: "Describe roles, shared devices, approvals and any confidential records. Avoid personal identifiers.",
    type: "text",
    optional: true,
  },
  {
    id: "reportingDetails",
    title: "What should happen with the records after they are captured?",
    hint: "Reports, exports, approvals, retention and the people who need the results.",
    type: "text",
    optional: true,
  },
  {
    id: "integrationDetails",
    title: "Which existing systems must this work with?",
    hint: "Name tools and the information that should move between them. Their integration permissions still need verification.",
    type: "text",
    optional: true,
  },
  {
    id: "bookingCapabilities",
    title: "What can your current booking provider already do?",
    hint: "Check reminders, cancellation rules, deposits and integrations before replacing a useful provider.",
    type: "text",
    optional: true,
  },
  {
    id: "websiteContent",
    title: "What should the website do, and who will maintain its content?",
    hint: "Existing site, available content, essential functionality and who needs to update it.",
    type: "text",
    optional: true,
  },
  {
    id: "currentAlternatives",
    title: "Have you tried an existing tool or a simpler process?",
    hint: "What worked, what was missing, and what needs to stay? No custom build is assumed.",
    type: "text",
    optional: true,
  },
  {
    id: "firstVersion",
    title: "What is the smallest version that would be useful?",
    hint: "Choose one essential outcome and describe how you would know it helps.",
    type: "text",
    optional: true,
  },
];
export function contextualGaps(
  a: Answers,
  evidence: Evidence[] = [],
  states: AnswerStates = {},
) {
  const statements = contextualStatements(a, evidence, states).filter(
    (s) => s.status === "confirmed-description",
  );
  const dims = new Set(statements.flatMap((s) => s.dimensions));
  const text = statements.map((s) => s.text).join(" ");
  const gaps: { id: string; score: number; reason: string }[] = [];
  const add = (id: string, score: number, reason: string, supplied = false) => {
    // A skipped/uncertain response ends this prompt too. No reload or rejection loop.
    if (!(id in a) && !supplied) gaps.push({ id, score, reason });
  };
  if (dims.has("offline"))
    add(
      "offlineDetails",
      850,
      "Offline storage and synchronization determine feasibility",
    );
  if (dims.has("data_capture"))
    add(
      "dataCaptureDetails",
      735,
      "Record structure and current capture affect tool suitability",
      /(?:record|capture).*(?:photos?|signatures?|serial numbers?|checklists?|fields?)/i.test(
        text,
      ),
    );
  if (
    dims.has("collaboration") &&
    (dims.has("data_capture") || dims.has("application"))
  )
    add(
      "accessDetails",
      720,
      "Roles and access determine data design",
      /(?:roles?|permissions?|only .* can|access control)/i.test(text),
    );
  if (dims.has("reporting") || dims.has("data_capture"))
    add(
      "reportingDetails",
      690,
      "Record use and retention affect the useful first version",
      /(?:reports?|exports?).*(?:manager|csv|pdf)/i.test(text),
    );
  if (/integrat|sync|existing software|accounting/i.test(text))
    add(
      "integrationDetails",
      670,
      "Check existing-system integration before custom delivery",
      !!a.integrationDetails,
    );
  if (a.bookingStatus === "existing" && dims.has("scheduling"))
    add(
      "bookingCapabilities",
      745,
      "Verify existing reminders and cancellation controls before replacement",
    );
  if (
    dims.has("presentation") &&
    /want|need|improv|showcase|portfolio/i.test(text)
  )
    add(
      "websiteContent",
      660,
      "Content ownership and functionality affect website scope",
      !!a.website || !!a.portfolio,
    );
  if (
    dims.has("offline") ||
    dims.has("application") ||
    dims.has("data_capture")
  )
    add(
      "currentAlternatives",
      640,
      "Existing products may be more proportionate",
      !!a.currentAlternatives,
    );
  if (dims.has("application") || dims.has("offline"))
    add(
      "firstVersion",
      620,
      "Bound exploratory delivery to a useful initial version",
      /smallest|first version|one feature|prototype/i.test(
        String(a.scopeDetails ?? ""),
      ),
    );
  return gaps;
}
