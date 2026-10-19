import { projectSolutions } from "../../shared/src/solutions.js";
import {
  emptyCanvasState,
  canvasStateSchema,
} from "../../shared/src/consulting.js";
import { operationalPattern, projectRequirements } from "./requirements.js";
import { operationalRecommendation } from "./operational-consulting.js";
import { consultingBrief } from "./consulting.js";
import { displayEvidence } from "../../shared/src/report.js";
import {
  opportunityDirections,
  explorationKeys,
  isExploration,
} from "./exploration.js";
import type {
  Answers,
  Recommendation,
  Report,
} from "../../shared/src/index.js";
import {
  signalAnswers,
  buildContext,
  extractCandidates,
} from "./context-extraction.js";
import { evaluateEvidence } from "./evidence-policy.js";
import { usableAnswers } from "./input-quality.js";
import type { Evidence, AnswerStates } from "../../shared/src/index.js";
import { evaluateReadiness } from "./discovery-readiness.js";
import { services } from "../../data/services.js";
import { matchCases, type CaseRecord } from "./library.js";
import { evaluateSolutions } from "./solution-evaluation.js";
export function recommend(
  a: Answers,
  pricing: { currency: string; hourlyRate?: number } = { currency: "ZAR" },
  evidence: Evidence[] = [],
  states: AnswerStates = {},
): Recommendation[] {
  const decision = evaluateEvidence(a, evidence, states);
  const operational = operationalRecommendation(
    usableAnswers(a, states),
    projectRequirements(a, states),
    pricing.currency,
  );
  const operationalSupported =
    !!operational &&
    decision.situationKnown &&
    decision.objectiveKnown &&
    !decision.conflicts.length &&
    !decision.unsupported;
  if (
    !decision.situationKnown ||
    !decision.objectiveKnown ||
    !decision.directions.length
  )
    return operationalSupported ? [operational!] : [];
  const confirmed = usableAnswers(a, states);
  a = decision.answers;
  const text = Object.values(confirmed).flat().join(" ");
  const simple =
    /affordable|limited|small amount|not complicated|no custom/i.test(text);
  const existingBooking = a.bookingStatus === "existing";
  const explanations: Record<string, string> = {
    social_presence:
      "You asked for an Instagram business presence; confirm the account setup, content and ongoing ownership before proceeding.",
    presentation: "You want a more credible presentation of your work.",
    modernization: "You described a problem with an existing website.",
    booking: existingBooking
      ? "Improve the existing booking workflow before considering another provider."
      : "Your appointment workflow has described friction; start with a simple workflow or existing scheduling provider.",
    invoices:
      /manual|copy|repetitive|duplicate|several hours|every week|weekly/i.test(
        text,
      )
        ? "Invoice preparation contains demonstrated repetitive work."
        : "You want to explore improving invoice preparation; confirm the current steps before automating.",
    content:
      "Your research or content preparation repeats and requires human review.",
    application:
      "You described intended functionality for an application; validate the smallest useful scope.",
    workflow_exploration:
      "Explore a workflow improvement or feasibility review; specialist requirements and delivery remain unconfirmed.",
  };
  const selected = decision.directions.flatMap((direction) =>
    direction.services.map((id) => ({
      id,
      problem: explanations[direction.id],
      keys: direction.sourceKeys,
      optional: id === "email",
      basis: direction.basis,
    })),
  );
  const standard = selected
    .filter(
      ({ id }) =>
        !operationalSupported || !["integration", "webapp"].includes(id),
    )
    .map(({ id, problem, keys, optional = false, basis }) => {
      const s = services.find((s) => s.id === id)!;
      const priced =
        pricing.hourlyRate !== undefined &&
        s.hoursLow !== null &&
        s.hoursHigh !== null;
      return {
        serviceId: id,
        problem,
        solution:
          id === "booking"
            ? "Hosted booking service"
            : id === "integration" && !existingBooking
              ? "Workflow feasibility and integration review"
              : s.name,
        evidence: keys
          .filter((k) => confirmed[k] !== undefined)
          .map(
            (k) =>
              `${k}: ${Array.isArray(confirmed[k]) ? (confirmed[k] as string[]).join(", ") : confirmed[k]}`,
          ),
        benefits: [
          id === "booking"
            ? "A shareable booking page may reduce manual appointment messages. Test availability and reminder settings with the selected service."
            : s.description,
        ],
        alternatives:
          id === "booking" || (existingBooking && id === "integration")
            ? [
                "Improve availability and reminders in the current workflow first",
                "Share a hosted booking link through existing channels; a full website may be unnecessary initially",
                "Configure or integrate an existing scheduling provider; compare subscriptions and cancellation controls",
                "Add booking to an existing website only if that channel is useful",
                "Custom booking software requires unique needs; greater engineering and maintenance costs are unlikely to be proportionate initially",
              ]
            : id === "webapp"
              ? [
                  "Validate the initial workflow with approved templates and existing software",
                  "Prototype a small web application after defining essential users and features",
                  "Native mobile requires evidence of device-specific needs and partner feasibility review",
                ]
              : id === "publishing"
                ? [
                    "Use templates and a manual research checklist",
                    /no AI|do not want AI|don.t want AI|no generative AI/i.test(
                      text,
                    )
                      ? "Reuse approved resource libraries with a human content review checklist"
                      : "Consider an AI-assisted pilot only after evaluating sources, privacy, accuracy and cost",
                  ]
                : [
                    "Improve the current process first",
                    "Use a suitable existing third-party tool; compare subscriptions, data portability and permissions",
                    "Custom engineering needs a demonstrated gap in existing tools and a maintenance plan",
                  ],
        complexity: [
          "webapp",
          "automation",
          "publishing",
          "integration",
        ].includes(id)
          ? simple
            ? "begin with a low-complexity pilot; custom scope requires review"
            : "requires technical scoping"
          : "low to moderate, subject to review",
        dependencies:
          id === "publishing"
            ? [
                "Approved curriculum/templates or sources and content rights",
                "Human review and approval",
                "Separate implementation scope; no scheduler or publication is created",
              ]
            : id === "webapp"
              ? [
                  "Essential user roles and initial acceptance criteria",
                  "Data privacy, template ownership and review workflow",
                  "Hosting, export, maintenance and supported integrations",
                ]
              : id === "booking" || (existingBooking && id === "integration")
                ? [
                    `${existingBooking ? "Current" : "Selected"} provider permissions and export/integration support`,
                    "Availability, reminders and cancellation policy",
                    "Vendor subscription terms and ongoing support",
                  ]
                : [
                    "Confirm requirements and ownership",
                    "Confirm ongoing maintenance, hosting and vendor terms",
                  ],
        confidence:
          basis === "interpreted"
            ? "conditional — interpreted from the cited user description; confirm scope with the consultant"
            : "conditional — based on self-reported facts; consultant validation required",
        delivery: s.delivery,
        nextSteps: [
          "Review this option with the consultant",
          "Validate constraints, budget and acceptance criteria",
          ...(simple
            ? [
                "Prioritize a small affordable first step; defer complex enhancements",
              ]
            : []),
          ...(buildContext(confirmed).specialistReview
            ? [
                "Specialist domain expertise and delivery capability require review before commitment",
              ]
            : []),
        ],
        optional,
        estimate: {
          status: priced ? "indicative_draft" : "manual_review",
          currency: pricing.currency,
          implementationLow: priced ? s.hoursLow! * pricing.hourlyRate! : null,
          implementationHigh: priced
            ? s.hoursHigh! * pricing.hourlyRate!
            : null,
          recurringStatus: "vendor_quote_required",
          notes:
            "Implementation and third-party subscriptions are separate. Obtain a scoped quotation and verify current vendor terms before committing.",
        },
      };
    });
  return operationalSupported ? [operational!, ...standard] : standard;
}
export function createReport(
  a: Answers,
  revision: number,
  synthetic: boolean,
  cases: CaseRecord[],
  pricing?: { currency: string; hourlyRate?: number },
  evidence: Evidence[] = [],
  states: AnswerStates = {},
  workspace: unknown = null,
): Report {
  const raw = a;
  a = usableAnswers(a, states);
  const signals = evaluateEvidence(raw, evidence, states).answers;
  const readiness = evaluateReadiness(raw, evidence, states);
  const matches = matchCases(raw, cases, evidence, states);
  let recommendations = evaluateSolutions(
    raw,
    recommend(raw, pricing, evidence, states),
    cases,
    evidence,
    states,
  );
  const liveOperational = operationalRecommendation(
    a,
    projectRequirements(raw, states, workspace),
    pricing?.currency,
  );
  if (liveOperational && recommendations.length && readiness.canAssess)
    recommendations = [
      liveOperational,
      ...recommendations.filter(
        (r) => !["integration", "webapp"].includes(r.serviceId),
      ),
    ];
  const matchedCases = matches
    .slice(0, 3)
    .map(
      ({
        id,
        title,
        sourceType,
        reasons,
        reviewStatus,
        reviewVersion,
        sourceRunId,
        limitations,
        usefulness,
      }) => ({
        id,
        title,
        sourceType,
        reasons,
        approvalStatus: reviewStatus,
        reviewVersion: reviewVersion ?? 0,
        sourceRunId: sourceRunId ?? null,
        outcomeVerification: "unverified" as const,
        limitations,
        usefulness,
      }),
    );
  const exploratory = isExploration(a);
  const idea = a.stage === "starting";
  const context = buildContext(a, evidence);
  const value = (key: string) =>
    typeof signals[key] === "string"
      ? key === "industry"
        ? String(
            extractCandidates(String(signals[key])).find(
              (p) => p.key === "industry",
            )?.value ?? signals[key],
          )
        : String(signals[key])
      : Array.isArray(signals[key])
        ? (signals[key] as string[]).join(", ")
        : null;
  const known = (keys: string[]) => [
    ...new Set(keys.flatMap((k) => (value(k) ? [value(k)!] : []))),
  ];
  const consulting = consultingBrief(raw, states, recommendations, workspace);
  if (consulting.approaches)
    recommendations = recommendations.map((r) => {
      const direction = consulting.directions.find((d) => d.id === r.serviceId);
      return direction && ["rejected", "deferred"].includes(direction.status)
        ? {
            ...r,
            solution: `${direction.status === "rejected" ? "Set aside" : "Deferred"}: ${direction.title}`,
            problem: direction.why,
          }
        : r;
    });
  const directions = consulting.directions;
  const explorationProfile = [
    ...known(explorationKeys.filter((k) => k !== "opportunityStyle")),
    ...(a.opportunityStyle && a.opportunityStyle !== "explore"
      ? [
          `You chose to explore ${directions[0]?.title.toLowerCase() ?? "this format"}. This is a preference for a trial, not evidence of demand.`,
        ]
      : []),
  ];
  const type = exploratory
    ? "exploration"
    : idea
      ? "idea"
      : a.stage === "specific"
        ? "solution"
        : "business";
  const report: Report = {
    consulting,
    presentationVersion: 2,
    assessmentType: type,
    title: consulting.approaches
      ? `${operationalPattern(a)?.subject ?? "Operations"} — workflow improvements`
      : exploratory
        ? "Your opportunity exploration"
        : idea
          ? "Your idea — first validation steps"
          : recommendations.some((r) => r.serviceId === "booking")
            ? "Simplifying appointment management"
            : a.stage === "specific"
              ? "Your solution — scope and next steps"
              : "Your business — practical improvements",
    status: "Preliminary assessment · not human-reviewed",
    synthetic,
    revision,
    createdAt: new Date().toISOString(),
    recommendations,
    matchedCases,
    sections: consulting.approaches
      ? [
          { title: "Executive overview", paragraphs: [consulting.summary] },
          ...(consulting.insights ?? []).map((i) => ({
            title: i.title,
            paragraphs: [i.summary],
          })),
          ...(["essential", "optional", "deferred", "unconfirmed"] as const)
            .map((priority) => ({
              title: `${priority[0].toUpperCase()}${priority.slice(1)} requirements`,
              paragraphs: (consulting.requirements ?? [])
                .filter((r) => r.priority === priority)
                .map((r) => r.label),
            }))
            .filter((s) => s.paragraphs.length),
          {
            title: "Recommended direction",
            paragraphs: consulting.directions.flatMap((d) => [d.title, d.why]),
          },
          {
            title: "Alternative approaches",
            paragraphs: consulting.approaches.map(
              (p) =>
                `${p.title}: ${p.strengths} ${p.tradeoffs} Appropriate when: ${p.appropriateWhen}`,
            ),
          },
          {
            title: "Costs and ongoing considerations",
            paragraphs: consulting.directions.map((d) => d.costToTest),
          },
          {
            title: "Practical pilot",
            paragraphs:
              consulting.directions[0]?.validation.map(
                (v, i) => `${i + 1}. ${v.kind}: ${v.action}`,
              ) ?? [],
          },
          { title: "Open questions", paragraphs: consulting.unknowns },
        ]
      : exploratory || idea
        ? [
            {
              title: "Executive overview",
              paragraphs: [
                exploratory
                  ? consulting.summary
                  : "Your concept is a starting hypothesis. Test the problem and intended audience before investing in implementation.",
              ],
            },
            {
              title: "Your starting point",
              paragraphs: (exploratory
                ? explorationProfile
                : known(["idea", "progress", "constraints"])
              ).length
                ? exploratory
                  ? consulting.facts.map((f) => `${f.label}: ${f.value}`)
                  : known(["idea", "progress", "constraints"])
                : [
                    "Your preferences remain open. Uncertainty is a valid starting point.",
                  ],
            },
            {
              title: "Possibilities to explore",
              paragraphs: exploratory
                ? directions.map((d) => `${d.title}. ${d.summary} ${d.why}`)
                : [
                    "Identify who experiences the problem and how they solve it today. Compare your concept with that current alternative.",
                  ],
            },
            {
              title: "What these possibilities mean",
              paragraphs: [
                "These directions are hypotheses grounded in your reported information where available. Fit is not validated market demand; no income, customer interest or technical feasibility is promised.",
              ],
            },
            {
              title: "A low-commitment experiment",
              paragraphs: [
                idea
                  ? "Choose one assumption about the problem or intended users. Speak with a possible user about what they do today. Try a sketch or manual demonstration and record what you learn before specifying a product."
                  : consulting.directions[0]
                    ? `${consulting.directions[0].firstStep} ${consulting.directions[0].costToTest} ${consulting.directions[0].validation.map((v) => `${v.kind}: ${v.action}`).join(" ")} Continue when: ${consulting.directions[0].continueWhen} Stop or change when: ${consulting.directions[0].stopWhen}`
                    : "Choose one assumption to test without committing money.",
              ],
            },
            {
              title: "Open questions",
              paragraphs: idea
                ? [
                    "Who experiences the problem, and what do they use today?",
                    "Which assumption could you test before spending money?",
                    "What constraints would shape a first trial?",
                    "What result would help you continue, change or stop?",
                  ]
                : consulting.unknowns,
            },
            {
              title: "Your next decision",
              paragraphs: [
                "Discuss one possibility in Chat or select a node in Solution canvas. You can change your starting situation in Discovery whenever your understanding changes. No software purchase or custom development is needed to begin exploring.",
              ],
            },
          ]
        : [
            {
              title: "Executive overview",
              paragraphs: [
                recommendations.length
                  ? `Start with ${recommendations
                      .filter((r) => !r.optional)
                      .map((r) => r.solution.toLowerCase())
                      .join(
                        " and ",
                      )}. Validate a small change before expanding scope.`
                  : "We can clarify the next useful step from your current information.",
                "Based on information you provided. No consultant review, market validation or technical audit has occurred.",
              ],
            },
            {
              title: "Current situation",
              paragraphs: [
                ...known(["industry", "idea", "request"]),
                ...known(["tools"]),
                ...(!value("tools")
                  ? ["Your current tools are still to be confirmed."]
                  : []),
                ...known(["goals"]),
              ],
            },
            {
              title: "Challenges and opportunities",
              paragraphs: [
                ...new Set(recommendations.map((r) => r.problem)),
                ...known([
                  ...(signals.bookingDetails ? [] : ["workflowDetails"]),
                  "bookingDetails",
                  "invoiceDetails",
                  "contentDetails",
                ]),
              ],
            },
            {
              title: "Recommended direction",
              paragraphs: recommendations.flatMap((r) => [
                r.solution,
                r.problem,
                ...r.benefits,
              ]),
            },
            {
              title: "Alternative approaches",
              paragraphs: recommendations.flatMap((r) => [
                r.solution,
                ...r.alternatives,
              ]),
            },
            {
              title: "Benefits and trade-offs",
              paragraphs: recommendations.flatMap((r) => [
                ...r.benefits,
                `Complexity: ${r.complexity}.`,
              ]),
            },
            {
              title: "Costs and ongoing considerations",
              paragraphs: [
                ...known(["budget", "constraints"]),
                ...recommendations.map((r) =>
                  r.estimate.implementationLow !== null
                    ? `${r.solution}: indicative implementation range ${r.estimate.currency} ${r.estimate.implementationLow}–${r.estimate.implementationHigh}; validate scope before quoting.`
                    : `${r.solution}: implementation costs need a defined scope and quotation.`,
                ),
                "Subscriptions, message charges, transaction fees and ongoing maintenance depend on the selected service, plan and usage. Verify current terms before committing.",
              ],
            },
            {
              title: "Dependencies and risks",
              paragraphs: [
                ...new Set(recommendations.flatMap((r) => r.dependencies)),
                "Provider integrations, permissions, data export, privacy and accessibility must be checked. Suggested connections have not been technically verified.",
              ],
            },
            {
              title: "Practical roadmap",
              paragraphs: [
                "1. Choose one outcome to improve and record how the process works today.",
                "2. Try the smallest useful change with a few real tasks. Compare suitable existing tools before custom development.",
                "3. Check costs, permissions and maintenance with the selected provider. Review the trial before expanding.",
                ...known(["timing"]),
              ],
            },
            {
              title: "Open questions and next decisions",
              paragraphs: [
                ...readiness.uncertainties,
                ...(readiness.criticalUnknowns ?? []),
                "Which option best fits how you want to work and maintain the solution?",
              ],
            },
            {
              title: "Supporting evidence",
              paragraphs: [
                "The situation and objectives above come from your supplied project information. Proposed solutions are interpretations, not confirmed requirements.",
                ...[
                  ...new Set(
                    recommendations.flatMap((r) =>
                      r.evidence.map(displayEvidence),
                    ),
                  ),
                ],
                ...(matchedCases.length
                  ? [
                      "Relevant reference patterns informed comparison only. They are unverified examples, not evidence of customer results.",
                    ]
                  : []),
              ],
            },
          ],
  };
  const parsed = canvasStateSchema.safeParse(workspace);
  const solutions = projectSolutions(
    report,
    parsed.success ? parsed.data : emptyCanvasState(),
    revision,
  );
  const presence = solutions.some(
    (s) => s.category === "website" || s.category === "social",
  );
  if (presence || solutions.some((s) => s.refined)) {
    for (const solution of solutions) {
      const direction = consulting.directions.find(
        (d) => d.id === (solution.recommendationId ?? solution.id),
      );
      if (direction)
        Object.assign(direction, {
          id: solution.id,
          title: solution.title,
          summary: solution.description,
          why: solution.why,
          requirements: solution.requirements
            .filter((r) => r.priority === "essential")
            .map((r) => r.label),
          risks: solution.unknowns,
          firstStep: solution.nextStep,
          validation: [
            {
              kind: "Launch checks",
              action:
                solution.category === "website"
                  ? "Check content accuracy, mobile readability, owner access and enquiry delivery before publishing."
                  : solution.category === "social"
                    ? "Verify account access, profile details, image permissions and the website contact link before publishing."
                    : "Review the changed scope and feasibility before agreeing delivery.",
            },
          ],
        });
      const r = report.recommendations.find(
        (r) => r.serviceId === (solution.recommendationId ?? solution.id),
      );
      if (r)
        Object.assign(r, {
          serviceId: solution.id,
          solution: solution.title,
          problem: solution.why,
          benefits: [solution.description],
          alternatives: solution.alternatives,
          dependencies: [
            ...solution.requirements
              .filter((r) => r.priority === "essential")
              .map((r) => r.label),
            ...solution.unknowns,
          ],
          nextSteps: [solution.nextStep],
        });
    }
    consulting.requirements = [
      ...new Map(
        solutions.flatMap((s) => s.requirements).map((r) => [r.id, r]),
      ).values(),
    ];
    if (presence) {
      consulting.relationship =
        solutions.length > 1 ? "complementary" : undefined;
      consulting.insights = [
        {
          title: "Requested outcomes",
          summary: solutions.map((s) => s.title).join("; "),
        },
        {
          title: "Launch scope",
          summary: [
            ...new Set(
              solutions.flatMap((s) =>
                s.requirements
                  .filter((r) => r.priority === "essential")
                  .map((r) => r.label),
              ),
            ),
          ].join("; "),
        },
        {
          title: "Deferred scope",
          summary:
            [
              ...new Set(
                solutions.flatMap((s) =>
                  s.requirements
                    .filter((r) => r.priority === "deferred")
                    .map((r) => r.label),
                ),
              ),
            ].join("; ") || "No deferred capabilities recorded.",
        },
      ];
      consulting.conclusions = solutions.map((s) => `${s.title}: ${s.why}`);
      for (const d of consulting.directions) {
        d.continueWhen =
          "The essential scope, content, ownership and ongoing costs fit the agreed launch needs.";
        d.stopWhen =
          "The approach adds capabilities or maintenance commitments outside the agreed scope.";
      }
    }
    consulting.summary = presence
      ? "Prepare the requested online presence around your content, enquiry channels and maintenance needs. Website and social profiles are complementary deliverables, not competing alternatives."
      : "Review the current user-refined solutions before agreeing implementation scope.";
    consulting.unknowns = [...new Set(solutions.flatMap((s) => s.unknowns))];
    report.sections = [
      { title: "Executive overview", paragraphs: [consulting.summary] },
      {
        title: "Proposed solutions",
        paragraphs: [
          ...solutions.map((s) => `${s.title}: ${s.why}`),
          ...report.recommendations
            .filter((r) => r.optional)
            .map(
              (r) => `Optional supporting setup — ${r.solution}: ${r.problem}`,
            ),
        ],
      },
      ...solutions.map((s) => ({
        title: `${s.title} — requirements`,
        paragraphs: [
          ...s.requirements.map((r) => `${r.label} (${r.priority})`),
          ...s.includes,
        ],
      })),
      {
        title: "Constraints",
        paragraphs: [...new Set(solutions.flatMap((s) => s.constraints))],
      },
      {
        title: "Implementation approaches",
        paragraphs: [...new Set(solutions.flatMap((s) => s.alternatives))],
      },
      {
        title: "Practical roadmap",
        paragraphs: solutions.map((s) => `${s.title}: ${s.nextStep}`),
      },
      { title: "Open questions", paragraphs: consulting.unknowns },
      {
        title: "Evidence and provenance",
        paragraphs: [...new Set(consulting.facts.map((f) => f.sourceKey))].map(
          (key) =>
            consulting.facts
              .filter((f) => f.sourceKey === key)
              .map((f) => f.quote)
              .join(" "),
        ),
      },
    ].filter((section) => section.paragraphs.length);
  }
  return report;
}
