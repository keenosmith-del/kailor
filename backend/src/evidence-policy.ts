import type {
  Answers,
  AnswerStates,
  Evidence,
  EvidenceDecision,
  EvidenceDirection,
} from "../../shared/src/index.js";
import { usableAnswers, evaluateInput } from "./input-quality.js";
import { signalAnswers } from "./context-extraction.js";
import {
  applyResolvedFacets,
  knowledgeConflicts,
  resolvedFacets,
  detectUpdateConflicts,
  clausesOf,
} from "./knowledge-conflicts.js";

// Independent evidence gates: no catalogue lookup, case match or recommendation count is proof.
export function evaluateEvidence(
  input: Answers,
  evidence: Evidence[] = [],
  states: AnswerStates = {},
): EvidenceDecision {
  const raw = usableAnswers(input, states),
    a = applyResolvedFacets(signalAnswers(raw), evidence);
  const text = Object.entries(raw)
    .filter(([k]) => !["budget", "timing"].includes(k))
    .flatMap(([, v]) =>
      clausesOf(String(v)).filter(
        (c) =>
          !/\b(?:might|maybe|what if|hypothetically|whether|if I|used to|thinking about)\b/i.test(
            c,
          ),
      ),
    )
    .join(" ");
  const conflicts = knowledgeConflicts(raw, evidence);
  const resolutions = resolvedFacets(evidence);
  const pending = evidence
    .filter((e) => e.active && e.status === "inferred")
    .flatMap((e) => [
      ...(e.provenance?.conflicts ?? []),
      ...detectUpdateConflicts(raw, e.key, e.value, evidence),
    ])
    .filter(
      (c) =>
        c.material &&
        !(
          c.facet !== "scope_budget" &&
          resolutions[c.facet] === c.proposed.value
        ),
    );
  for (const c of pending)
    if (!conflicts.some((x) => x.id === c.id)) conflicts.push(c);
  const situationKnown = !!(
    raw.industry ||
    raw.idea ||
    raw.request ||
    raw.frustrations ||
    raw.workflowDetails ||
    raw.clarification ||
    (raw.goals && String(raw.goals).split(/\s+/).length >= 5)
  );
  const problems = Array.isArray(a.problems) ? a.problems : [];
  const sourceKeys = (pattern: RegExp, extra: string[] = []) =>
    Object.entries(raw)
      .filter(([k, v]) => pattern.test(String(v)) || extra.includes(k))
      .map(([k]) => k);
  const directions: EvidenceDirection[] = [];
  const add = (
    id: string,
    services: string[],
    keys: string[],
    limitations: string[] = [],
  ): void => {
    if (keys.length && services.length)
      directions.push({
        id,
        services,
        sourceKeys: [...new Set(keys)],
        basis: keys.includes("problems") ? "explicit" : "interpreted",
        limitations,
      });
  };
  const presentation =
    problems.includes("credibility") ||
    /portfolio|showcase|professional presence|credible gallery|present.*work|website for.*(?:photography|business|work|offering)/i.test(
      text,
    );
  if (
    presentation &&
    (raw.goals ||
      raw.portfolio ||
      /want|need|goal|gallery|showcase/i.test(text) ||
      problems.includes("credibility"))
  ) {
    const services =
      Array.isArray(a.presence) && a.presence.includes("email")
        ? []
        : ["email"];
    if (
      a.websitePreference !== "declined" &&
      a.websiteStatus !== "existing" &&
      !(Array.isArray(a.presence) && a.presence.includes("website"))
    )
      services.unshift(
        a.kind === "professional" || /portfolio/i.test(text)
          ? "portfolio"
          : "website",
      );
    add(
      "presentation",
      services,
      sourceKeys(
        /portfolio|professional|credib|gallery|showcase|website for/i,
        ["problems", "goals"],
      ),
    );
  }
  if (
    problems.includes("outdated") &&
    a.websiteStatus !== "absent" &&
    Array.isArray(a.presence) &&
    a.presence.includes("website") &&
    raw.website
  )
    add("modernization", ["modernization"], ["website", "problems"]);
  const booking =
    /manual bookings?|bookings? manually|appointments? (?:through|via)|easier.*book|missed.*appointments?|(?:booking|appointment|customer).*reminder|cancellations?/i.test(
      text,
    );
  if ((problems.includes("booking") || booking) && booking)
    add(
      "booking",
      [a.bookingStatus === "existing" ? "integration" : "booking"],
      sourceKeys(/book|appointment|reminder|cancellation/i),
      ["Confirm reminder/cancellation workflow and provider terms"],
    );
  const invoices =
    /invoic/i.test(text) &&
    /manual|spreadsheet|copy|repetitive|duplicate|every week|weekly|several hours|automat/i.test(
      text,
    );
  if (invoices && a.automationPreference !== "declined")
    add(
      "invoices",
      ["automation"],
      sourceKeys(/invoic|spreadsheet|copy|manual/i),
      ["Validate existing accounting permissions and approval controls"],
    );
  const content =
    /research|lesson|draft|content|publishing/i.test(text) &&
    /recurring|weekly|repeated|approval|review|template|every/i.test(text);
  if (
    content &&
    (problems.includes("content") ||
      raw.contentDetails ||
      /weekly lesson|recurring research|draft generation/i.test(text))
  )
    add(
      "content",
      ["publishing"],
      sourceKeys(/content|research|lesson|draft|publishing/i),
      ["Human content review and source/curriculum approval remain necessary"],
    );
  const requestedScope = clausesOf(String(a.request ?? ""))
    .filter(
      (c) =>
        !/\b(?:might|maybe|what if|hypothetically|whether|if I|used to|thinking about)\b/i.test(
          c,
        ),
    )
    .join(". ");
  const application =
    !!a.request &&
    /(?:allows?|schedule|create|record|manage|upload|templates?|draft|approv|publishing|export|to [\p{L}]+ [\p{L}]+)(?!.*every feature)/iu.test(
      requestedScope,
    ) &&
    (/application|web app|mobile app|platform|software product/i.test(
      requestedScope,
    ) ||
      (problems.includes("custom") &&
        /workflow|approval|storage|export/i.test(requestedScope))) &&
    /allows?|for |users?|customers?|teachers?|workflow|approval|record|template/i.test(
      requestedScope,
    );
  if (application && a.appPreference !== "declined")
    add(
      "application",
      ["webapp"],
      sourceKeys(/application|web app|platform|teacher|template|scope/i, [
        "request",
        "scopeDetails",
      ]),
      ["Validate a small initial version and existing-tool alternatives"],
    );
  const operational =
    /inspect|maintenan|repair|inventory|records?|technicians?|orders?|production|fulfil|offline|synchroni|reporting|data entry|approvals?|workflow|integrat/i.test(
      text,
    );
  const concreteWorkflow =
    !!raw.workflowDetails &&
    String(raw.workflowDetails).trim().split(/\s+/u).length >= 4;
  const goal =
    /want|need|reduce|improve|manage|record|coordinate|track|help|schedule/i.test(
      text,
    ) &&
    (raw.goals ||
      raw.request ||
      raw.frustrations ||
      raw.workflowDetails ||
      raw.clarification ||
      /\b(?:want|need|reduce|improve)\b/i.test(text));
  if (
    (!directions.length ||
      /offline|no internet|inspect|maintenan|quality control|inventory/i.test(
        Object.entries(raw)
          .filter(([key]) => key !== "industry")
          .map(([, v]) => String(v))
          .join(" "),
      )) &&
    !directions.some((d) => d.id === "application") &&
    (operational || concreteWorkflow) &&
    goal &&
    a.automationPreference !== "declined"
  )
    add(
      "workflow_exploration",
      ["integration"],
      sourceKeys(
        /inspect|maintenan|repair|inventory|record|technician|orders?|production|fulfil|workflow|integrat|report|data entry/i,
        ["workflowDetails"],
      ),
      [
        "Exploratory feasibility review; specialist expertise and delivery are not established",
        "Clarify users, current process, records, offline/data synchronization and reporting",
      ],
    );
  const unsupported =
    /diagnos(?:e|is)|clinical (?:decision|treatment)|prescribe|weapon|steal (?:credentials|passwords)|bypass authentication/i.test(
      text,
    );
  const objectiveKnown =
    !!directions.length ||
    !!(
      raw.goals &&
      evaluateInput(raw.goals, "goals").usableFacts &&
      String(raw.goals).split(/\s+/).length > 3 &&
      !/^improve (?:my|the|our) (?:work|business)[.!]*$/i.test(
        String(raw.goals),
      )
    );
  const unknowns = ["constraints", "budget", "tools", "timing"]
    .filter((k) => !raw[k])
    .map((k) => `${k}: ${states[k] ?? "not provided"}`);
  const reasons = !situationKnown
    ? ["Describe what you are working on or experiencing"]
    : !objectiveKnown
      ? ["Clarify one practical outcome or difficulty"]
      : !directions.length
        ? [
            "Describe the process or essential requirement before selecting technology",
          ]
        : conflicts.length
          ? [
              "Resolve conflicting information before preparing a new assessment",
            ]
          : unsupported
            ? [
                "This request needs qualified specialist review; a normal technology recommendation is not defensible",
              ]
            : [
                "Useful situation and objective evidence support a qualified initial direction",
              ];
  return {
    answers: a,
    directions: conflicts.length || unsupported ? [] : directions,
    conflicts,
    unknowns,
    situationKnown,
    objectiveKnown,
    unsupported,
    reasons,
  };
}
