import {
  conciseSummary,
  meaningful,
  presenceCapabilities,
} from "./project-intent.js";
import type {
  CanvasState,
  ConsultingFact,
  ProjectRequirement,
} from "./consulting.js";
import type { Report } from "./index.js";

export type SolutionVisual =
  | "website"
  | "social"
  | "booking"
  | "delivery"
  | "store"
  | "automation"
  | "platform";
export type Solution = {
  id: string;
  recommendationId?: string;
  revision: number;
  title: string;
  description: string;
  objective?: string;
  refined?: boolean;
  category?: SolutionVisual;
  visual: SolutionVisual;
  source: "recommendation" | "user";
  decision: string;
  selected: boolean;
  reviewRequired: boolean;
  requirements: ProjectRequirement[];
  includes: string[];
  facts: ConsultingFact[];
  why: string;
  constraints: string[];
  request?: {
    id: string;
    status: string;
    createdAt: string;
    scopeRevision: number;
  };
  unknowns: string[];
  alternatives: string[];
  nextStep: string;
};
export type SolutionCanvas = {
  revision: number;
  projectRevision: number;
  state: CanvasState;
  solutions: Solution[];
  note: string;
};
export function visualFor(title: string): SolutionVisual {
  if (/instagram|social (?:media|profile)/i.test(title)) return "social";
  if (/booking|appointment/i.test(title)) return "booking";
  if (/delivery|dispatch|logistics/i.test(title)) return "delivery";
  if (/store|commerce|shop/i.test(title)) return "store";
  if (/website|portfolio/i.test(title)) return "website";
  if (/automat|integration|workflow/i.test(title)) return "automation";
  return "platform";
}
/** A non-destructive projection of actual recommendation identities; capabilities never create tiles. */
export function projectSolutions(
  report: Report,
  state: CanvasState,
  revision: number,
): Solution[] {
  const brief = report.consulting;
  // Selection metadata is excluded from the per-solution scope revision below.
  const recommendations = report.recommendations;
  const directions = (brief?.directions ?? []).filter(
    (d) =>
      !/illustrative example/i.test(d.why) &&
      (d.basis.length > 0 || recommendations.some((r) => r.serviceId === d.id)),
  );
  const ids = [
    ...new Set([
      ...directions.map((d) => d.id),
      ...recommendations
        .filter(
          (r) =>
            !r.optional &&
            !brief?.directions.some(
              (d) =>
                d.id === r.serviceId && /illustrative example/i.test(d.why),
            ),
        )
        .map((r) => r.serviceId),
    ]),
  ];
  const legacyAliases = new Map<string, string>();
  for (const sourceId of ids) {
    const candidates = Object.entries(state.edits).filter(
      ([key, edit]) =>
        !ids.includes(key) &&
        ["webapp", "website", "integration", "portfolio", "instagram"].includes(
          key,
        ) &&
        !!edit.title &&
        visualFor(edit.title) ===
          visualFor(
            directions.find((d) => d.id === sourceId)?.title ??
              recommendations.find((r) => r.serviceId === sourceId)?.solution ??
              "",
          ),
    );
    if (
      candidates.length === 1 &&
      ![...legacyAliases.values()].includes(candidates[0][0])
    )
      legacyAliases.set(sourceId, candidates[0][0]);
  }
  const result: Solution[] = ids.map((sourceId) => {
    const id = legacyAliases.get(sourceId) ?? sourceId;
    const direction = directions.find((d) => d.id === sourceId);
    const recommendation = recommendations.find(
      (r) => r.serviceId === sourceId,
    );
    const edit = state.edits[id];
    const rawTitle = direction?.title ?? recommendation!.solution;
    const title =
      edit?.title ??
      (id === "website"
        ? "Build a website"
        : id === "booking"
          ? "Online booking system"
          : rawTitle
              .replace(/^Evaluate an established /i, "")
              .replace(/delivery-management/i, "delivery management")
              .replace(/^./, (c) => c.toUpperCase()));
    const facts =
      brief?.facts.filter((f) => direction?.basis.includes(f.id)) ?? [];
    let requirements = (brief?.requirements ?? []).filter(
      (r) =>
        !r.id.startsWith("requirement-user-") &&
        (ids.length === 1 ||
          (brief?.approaches
            ? id === "integration"
            : r.provenance.some((p) =>
                facts.some(
                  (f) =>
                    f.sourceKey === p.sourceKey && f.quote.includes(p.quote),
                ),
              ))),
    );
    if (sourceId === "integration" && ids.length > 1)
      requirements = requirements.filter(
        (r) =>
          !presenceCapabilities.some(([key]) => r.id === `requirement-${key}`),
      );
    const category = visualFor(title);
    const presence = category === "website" || category === "social";
    if (presence) {
      const relevant = (id: string) =>
        category === "social"
          ? /social-|branding/.test(id)
          : !/social-/.test(id) &&
            presenceCapabilities.some(([key]) => id === `requirement-${key}`);
      requirements = (brief?.requirements ?? []).filter((r) => relevant(r.id));
      for (const [key, label, pattern] of presenceCapabilities) {
        if (
          !relevant(`requirement-${key}`) ||
          !edit?.notes ||
          !pattern.test(edit.notes)
        )
          continue;
        if (!requirements.some((r) => r.id === `requirement-${key}`))
          requirements.push({
            id: `requirement-${key}`,
            label,
            priority:
              key === "booking" && /later|defer|can wait/i.test(edit.notes)
                ? "deferred"
                : "essential",
            provenance: [
              { sourceKey: "canvas", quote: edit.notes, basis: "explicit" },
            ],
          });
      }
    }
    for (const c of edit?.capabilities ?? []) {
      requirements = requirements.filter(
        (r) => r.label.toLowerCase() !== c.label.toLowerCase(),
      );
      if (
        !requirements.some(
          (r) => r.label.toLowerCase() === c.label.toLowerCase(),
        )
      )
        requirements.push({
          id: `requirement-user-${c.id}`,
          label: c.label,
          priority: c.priority,
          provenance: [
            { sourceKey: "canvas", quote: c.label, basis: "explicit" },
          ],
        });
    }
    const evidenceText =
      facts.map((f) => f.quote).join(" ") +
      " " +
      (recommendation?.evidence.join(" ") ?? "");
    const capabilities =
      id === "website" || id === "portfolio"
        ? [
            /services?|offering/i.test(evidenceText)
              ? "Information about your services"
              : "",
            /contact|enquir|inquir/i.test(evidenceText)
              ? "Contact or enquiry flow"
              : "",
            /portfolio|showcase|gallery/i.test(evidenceText)
              ? "A showcase of your work"
              : "",
            /(?:edit|manage|maintain|updat).{0,20}content/i.test(evidenceText)
              ? "Content updates and ownership"
              : "",
          ].filter(Boolean)
        : id === "instagram"
          ? [
              "Business profile setup",
              "Account ownership and content responsibilities to agree",
            ]
          : [];
    const decision = edit?.decision ?? direction?.status ?? "hypothesis";
    const selection = state.selections?.[id];
    return {
      id,
      recommendationId: sourceId,
      revision,
      title,
      description:
        edit?.notes ||
        recommendation?.benefits[0] ||
        direction?.summary ||
        recommendation?.problem ||
        "Explore this proposed solution.",
      visual: visualFor(title),
      source: "recommendation",
      refined: !!(edit?.title || edit?.notes || edit?.capabilities?.length),
      category,
      decision,
      selected:
        selection?.selected ?? ["selected", "developing"].includes(decision),
      reviewRequired:
        !!selection?.selected && selection.basisRevision !== revision,
      requirements,
      includes: requirements.length
        ? []
        : capabilities.length
          ? capabilities
          : (direction?.requirements ??
            recommendation?.dependencies.filter(
              (x) => !x.startsWith("Reference "),
            ) ??
            []),
      facts,
      why:
        direction?.why ??
        recommendation?.problem ??
        "Review the project evidence before proceeding.",
      constraints:
        brief?.facts.filter(isProjectConstraint).map((f) => f.quote) ?? [],
      unknowns: brief?.unknowns ?? [],
      alternatives:
        brief?.approaches?.map((a) => `${a.title}: ${a.tradeoffs}`) ??
        recommendation?.alternatives ??
        [],
      nextStep:
        direction?.firstStep ??
        recommendation?.nextSteps[0] ??
        "Confirm the scope before committing.",
    };
  });
  for (const idea of state.additions.filter((a) => a.kind === "idea")) {
    if (result.some((s) => s.id === idea.id)) continue;
    const edit = state.edits[idea.id],
      selection = state.selections?.[idea.id];
    const title = edit?.title ?? idea.title;
    result.push({
      id: idea.id,
      revision,
      title,
      description: edit?.notes || idea.notes,
      visual: visualFor(title),
      source: "user",
      decision: edit?.decision ?? "exploring",
      selected: selection?.selected ?? edit?.decision === "selected",
      reviewRequired:
        !!selection?.selected && selection.basisRevision !== revision,
      requirements: (edit?.capabilities ?? []).map((c) => ({
        id: `requirement-user-${c.id}`,
        label: c.label,
        priority: c.priority,
        provenance: [
          { sourceKey: "canvas", quote: c.label, basis: "explicit" as const },
        ],
      })),
      includes: [],
      facts: [],
      constraints:
        brief?.facts.filter(isProjectConstraint).map((f) => f.value) ?? [],
      why: "You proposed this solution. Its suitability has not yet been assessed by kailor.",
      unknowns: ["Validate fit, scope and feasibility."],
      alternatives: [],
      nextStep:
        "Discuss this idea using your project context before committing.",
    });
  }
  return result.map((solution) => {
    const edited = state.edits[solution.id];
    const category = visualFor(solution.title);
    const refined = !!(edited?.title || edited?.notes || edited?.capabilities);
    const objective = solution.description;
    const presence = category === "website" || category === "social";
    const website = category === "website";
    const scopeRevision = [
      ...JSON.stringify({
        title: solution.title,
        objective,
        requirements: solution.requirements,
        includes: solution.includes,
        constraints: solution.constraints,
      }),
    ].reduce((hash, c) => (Math.imul(hash, 31) + c.charCodeAt(0)) >>> 0, 0);
    return {
      ...solution,
      revision: scopeRevision,
      reviewRequired:
        !!state.selections?.[solution.id]?.selected &&
        state.selections[solution.id].basisRevision !== scopeRevision,
      category,
      refined,
      objective,
      description: conciseSummary(objective),
      includes: meaningful(
        presence
          ? website
            ? [
                ...(!solution.requirements.some(
                  (r) => r.id === "requirement-responsive",
                )
                  ? ["Mobile-friendly presentation to verify before launch"]
                  : []),
              ]
            : ["Confirm account ownership and content responsibilities"]
          : solution.includes,
      ),
      constraints: meaningful([
        ...solution.constraints,
        ...(edited?.notes
          ?.split(/\n+|(?<=[.!?;])\s+/)
          .filter((s) =>
            /affordable|easy to maintain|no custom|don.t need|do not need|must not|avoid|limited/i.test(
              s,
            ),
          ) ?? []),
      ]),
      unknowns: meaningful(
        presence
          ? [
              ...(website
                ? [
                    "Business name, branding and available content",
                    "Exact services, prices and coverage",
                    "Website platform and content ownership",
                  ]
                : [
                    "Existing account and business profile ownership",
                    "Photographs and publishing responsibilities",
                  ]),
              ...(!brief?.facts.some((f) => f.sourceKey === "budget")
                ? ["Budget or investment range"]
                : []),
              ...(!brief?.facts.some((f) => f.sourceKey === "timing")
                ? ["Launch deadline"]
                : []),
            ]
          : solution.unknowns,
      ),
      why: refined
        ? `Refined by you. The current ${website ? "website" : category === "social" ? "social presence" : "solution"} scope reflects your saved changes. Suitability and implementation feasibility still need review; the original recommendation is historical.`
        : presence
          ? website
            ? "A business website presents your offering and gives customers a clear way to enquire. Compare manageable existing platforms before commissioning custom engineering."
            : "A separate Instagram business profile supports visual promotion and local discovery, complementing your website with consistent branding."
          : solution.why,
      alternatives: meaningful(
        presence
          ? website
            ? [
                "Managed website builder: simpler self-maintenance; compare recurring fees and portability",
                "Content-management platform: more flexibility with additional maintenance",
                "Custom implementation: consider only for a demonstrated gap in existing platforms",
              ]
            : [
                "Owner-managed profile with a reusable content plan",
                "Professional setup and handover, with account ownership retained by you",
              ]
          : refined
            ? []
            : solution.alternatives,
      ),
      nextStep: presence
        ? website
          ? "Confirm branding and prepare services, prices, coverage and photographs. Compare affordable platforms, publish the essential pages and test enquiry channels. Keep deferred booking outside the launch scope."
          : "Confirm account ownership, align branding with the website and prepare photographs, profile details and an initial publishing plan."
        : refined
          ? "Review your revised objective, capabilities and constraints before agreeing an implementation approach."
          : solution.nextStep,
    };
  });
}
export function solutionStatus(solution: Solution) {
  if (solution.reviewRequired) return "Selected · review changes";
  if (solution.request)
    return solution.request.scopeRevision !== solution.revision
      ? "Help requested · scope changed"
      : "Professional help requested";
  if (solution.refined)
    return solution.selected
      ? "Refined by you · selected · needs review"
      : "Refined by you · needs review";
  if (solution.selected) return "Selected for consideration";
  if (solution.decision === "rejected") return "Set aside";
  if (solution.decision === "deferred") return "Deferred";
  return solution.source === "user" ? "Your proposal" : "Recommended";
}

export function unresolvedSelections(
  state: CanvasState,
  solutions: Solution[],
) {
  return [
    ...new Set([
      ...Object.entries(state.edits)
        .filter(
          ([id, e]) =>
            !id.startsWith("requirement-") &&
            ["selected", "developing"].includes(e.decision ?? "") &&
            state.selections?.[id]?.selected !== false,
        )
        .map(([id]) => id),
      ...Object.entries(state.selections ?? {})
        .filter(([, s]) => s.selected)
        .map(([id]) => id),
    ]),
  ].filter((id) => !solutions.some((s) => s.id === id));
}

export function isProjectConstraint(fact: ConsultingFact) {
  return (
    fact.kind === "constraint" ||
    ["constraints", "budget", "timing"].includes(fact.sourceKey)
  );
}
