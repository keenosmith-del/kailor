import { projectRequirements } from "./requirements.js";
import { enrichOperationalBrief } from "./operational-consulting.js";
import type {
  Answers,
  AnswerStates,
  Recommendation,
} from "../../shared/src/index.js";
import {
  canvasStateSchema,
  type ConsultingBrief,
  type ConsultingDirection,
  type ConsultingFact,
} from "../../shared/src/consulting.js";
import { usableAnswers } from "./input-quality.js";

// Reusable task families, not a persona detector. Candidates need attributed capability evidence.
const capabilities = [
  {
    id: "visual-design",
    label: "Design",
    title: "Small design services",
    signal: /\bcanva\b|\bdesign\w*\b|illustrat|invitation|visual content/i,
    task: "one invitation, social post or promotional asset",
    needs: [
      "A tool you can already use",
      "A clear brief and permission to use supplied images",
    ],
    risk: "Informal experience is not proof of professional delivery; check revisions, licensing and quality.",
  },
  {
    id: "coordination",
    label: "Organisation",
    title: "Planning and organisation assistance",
    signal:
      /event planning|organi[sz]|plan(?:ning|ned)? (?:events?|parties|schedule)|scheduling|checklists?|event preparation/i,
    task: "one event checklist, schedule or planning task",
    needs: [
      "A tightly defined task",
      "Clear boundaries about responsibility and deadlines",
    ],
    risk: "Start with preparation support; avoid taking responsibility for an entire event before testing delivery.",
  },
  {
    id: "administration",
    label: "Administration",
    title: "Focused administrative support",
    signal:
      /\blists?\b|schedules?|spreadsheet|administrat|record.?keeping|data entry|office|bookkeeping/i,
    task: "one list, schedule, record or administrative task",
    needs: [
      "A basic device and a suitable existing tool",
      "Permission and safe handling of any personal information",
    ],
    risk: "Do not handle sensitive records or regulated work without the right skills and safeguards.",
  },
  {
    id: "writing",
    label: "Writing",
    title: "Small writing and editing tasks",
    signal: /writ(?:e|ing)|edit(?:ing)?|copywriting|proofread|storytelling/i,
    task: "one short piece of writing or editing",
    needs: [
      "A sample of your own work",
      "An agreed audience and review process",
    ],
    risk: "Validate accuracy, originality and the time needed for revisions.",
  },
  {
    id: "practical-help",
    label: "Practical work",
    title: "A narrowly scoped practical service",
    signal: /repair|woodwork|garden|craft|sew|mend|practical hands.on|fixing/i,
    task: "one safe, limited practical task using existing equipment",
    needs: [
      "Appropriate tools and demonstrated ability",
      "A check of safety and any local requirements",
    ],
    risk: "Do not take on safety-critical or licensed work without suitable qualifications.",
  },
  {
    id: "knowledge-sharing",
    label: "Knowledge sharing",
    title: "A small learning or teaching experiment",
    signal: /teach|tutor|explain|mentor|language|maths|mathematics|coding/i,
    task: "one short explanation or learning session in a subject you actually know",
    needs: [
      "A specific learner need",
      "A small example you can explain confidently",
    ],
    risk: "Interest alone is not teaching expertise; be honest about your level and avoid credential claims.",
  },
];
const labels: Record<string, string> = {
  branding: "Business identity",
  launchContent: "Available launch content",
  socialAccount: "Instagram account",
  motivation: "Your goal",
  goals: "Your goal",
  interests: "Interests",
  strengths: "Experience",
  explorationTime: "Time and resources",
  constraints: "Constraints",
  budget: "Budget",
  tools: "Existing tools",
  idea: "Your idea",
  industry: "Your activity",
  request: "Intended outcome",
  timing: "Timing",
  experimentComfort: "Preferred first step",
  workflowDetails: "Current workflow",
  offlineDetails: "Offline requirements",
  dataCaptureDetails: "Information to capture",
  accessDetails: "Access requirements",
  reportingDetails: "Reporting needs",
  integrationDetails: "Connections to check",
  scopeDetails: "Scope",
  firstVersion: "First-phase priorities",
  currentAlternatives: "Current alternatives",
  clarification: "Additional context",
  frustrations: "Operational problems",
};
const clean = (value: unknown) =>
  Array.isArray(value) ? value.join(", ") : String(value ?? "");
const compact = (s: string, max = 150) =>
  s.length > max ? `${s.slice(0, max - 1).trim()}…` : s.replace(/[.;!?]+$/, "");
export function consultingBrief(
  raw: Answers,
  states: AnswerStates = {},
  recommendations: Recommendation[] = [],
  workspace: unknown = null,
): ConsultingBrief {
  const a = usableAnswers(raw, states),
    facts: ConsultingFact[] = [];
  for (const [key, label] of Object.entries(labels)) {
    if (!a[key]) continue;
    const value = clean(a[key]);
    const clauses = value.split(/(?<=[.!?;])\s+|\n+/).filter(Boolean);
    for (const [i, quote] of clauses.entries()) {
      const kind: ConsultingFact["kind"] = /^(?:goals|motivation)$/.test(key)
        ? "goal"
        : /affordable|easy to maintain|useful later|not.*first version|don.t need|do not need|avoid|limited|low.?risk|cannot|can.t|don.t want|not want|full.time|hours? (?:a|per|each)|\d\s*[–-]\s*\d.*hours/i.test(
              quote,
            )
          ? "constraint"
          : /phone|laptop|internet|computer|canva|equipment/i.test(quote)
            ? "resource"
            : key === "strengths"
              ? "experience"
              : key === "interests"
                ? "interest"
                : /goal|motivation/.test(key)
                  ? "goal"
                  : /problem|frustration/.test(key)
                    ? "problem"
                    : "fact";
      facts.push({
        id: `${key}-${i}`,
        label,
        sourceKey: key,
        quote: quote.slice(0, 1200),
        value: compact(quote),
        kind,
      });
    }
  }
  const parsed = canvasStateSchema.safeParse(workspace),
    live = parsed.success ? parsed.data : { edits: {}, additions: [] };
  live.additions = live.additions.map((note) => ({
    ...note,
    title: live.edits[note.id]?.title ?? note.title,
    notes: live.edits[note.id]?.notes ?? note.notes,
  }));
  for (const note of live.additions.filter((n) => n.kind === "constraint"))
    facts.push({
      id: note.id,
      label: note.title,
      sourceKey: "canvas",
      quote: note.notes,
      value: compact(note.notes),
      kind: "constraint",
    });
  // Keep the visual projection bounded without allowing references to facts omitted from it.
  // Include each answer field first, then its strongest constraints, then other detail.
  const complete = facts.splice(0),
    firstByField = [
      ...new Map(
        complete.map((f) => [
          f.sourceKey,
          complete.find((x) => x.sourceKey === f.sourceKey)!,
        ]),
      ).values(),
    ];
  const seen = new Set<string>();
  facts.push(
    ...[
      ...firstByField,
      ...complete.filter((f) => f.kind === "constraint"),
      ...complete,
    ]
      .filter((f) => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      })
      .slice(0, 24),
  );
  const text = facts.map((f) => f.quote).join(" ");
  const commercial = /income|earn|paid|money|customers?|business|sell/i.test(
    clean(a.motivation ?? a.goals),
  );
  const constraints = facts.filter((f) => f.kind === "constraint"),
    time =
      facts.find((f) => /\d.*hours?/i.test(f.quote)) ??
      facts.find((f) => /full.time/i.test(f.quote));
  const expertise = facts.filter((f) =>
    ["strengths", "interests", "tools", "industry"].includes(f.sourceKey),
  );
  // Exclusions override lexical matches: wanting to avoid a task is not evidence of ability.
  const positiveEvidence = expertise.filter(
    (f) =>
      !/(?:do not|don't|cannot|can't|hate|avoid|no experience|not interested|dislike|not good)\b/i.test(
        f.quote,
      ),
  );
  const excluded = (signal: RegExp) =>
    facts.some((f) =>
      f.quote
        .split(/[.;\n]/)
        .some(
          (clause) =>
            /(?:avoid|don.t want|do not want|not interested|no experience|cannot|can.t|dislike|hate)\b/i.test(
              clause,
            ) && signal.test(clause),
        ),
    );
  const candidates = capabilities
    .filter((c) => !excluded(c.signal))
    .map((c) => ({
      c,
      basis: positiveEvidence.filter((f) => c.signal.test(f.quote)),
      score: positiveEvidence.reduce(
        (n, f) =>
          n +
          (c.signal.test(f.quote) ? (f.sourceKey === "strengths" ? 3 : 1) : 0),
        0,
      ),
    }))
    .filter((x) => x.basis.length)
    .sort((x, y) => y.score - x.score);
  const exploratory = a.stage === "uncertain";
  const directions: ConsultingDirection[] = exploratory
    ? candidates
        .map(({ c, basis, score }) => ({
          basis,
          score,
          c:
            a.opportunityStyle === "product"
              ? {
                  ...c,
                  title: `${c.label} resources to test`,
                  task: `one draft reusable template or resource based on ${c.task}`,
                }
              : a.opportunityStyle === "content"
                ? {
                    ...c,
                    title: `${c.label} content to explore`,
                    task: `one short demonstration based on ${c.task}`,
                  }
                : c,
        }))
        .slice(0, 3)
        .map(({ c, basis }) => ({
          id: c.id,
          title: c.title,
          summary: `Test a small, clearly bounded offer: ${c.task}.`,
          basis: [
            ...basis.map((f) => f.id),
            ...constraints.slice(0, 2).map((f) => f.id),
          ],
          why: `This builds on what you described: ${basis.map((f) => compact(f.quote, 95)).join("; ")}. ${constraints.length ? `Respect these stated limits: ${constraints.map((f) => compact(f.quote, 120)).join("; ")}.` : "Try a sample before committing to delivery."}`,
          requirements: c.needs,
          risks: [c.risk, "Demand and willingness to pay remain unverified."],
          costToTest: /limited|avoid|no .*subscription|low.?risk/i.test(text)
            ? "Use tools and resources you already have. Do not buy stock, rent premises or start subscriptions for this trial; check any unavoidable costs first."
            : "Begin with existing resources. Confirm any material, tool or travel costs before committing; no price estimate has been verified.",
          firstStep: `Choose ${c.task}; define one deliverable and who it would help.`,
          validation: [
            {
              kind: "Interest",
              action:
                "Make a small sample and notice whether you enjoy the actual work.",
            },
            {
              kind: "Ability",
              action:
                "Time one limited delivery; ask for specific feedback on usefulness and quality.",
            },
            {
              kind: "Problem",
              action:
                "Speak to two possible users about what they do today and what is difficult.",
            },
            {
              kind: commercial ? "Willingness to pay" : "Usefulness",
              action: commercial
                ? "Offer a clearly scoped paid pilot with a price you can justify. Free work alone does not validate payment demand."
                : "Ask whether someone would choose to use the result, without assuming a commercial goal.",
            },
            {
              kind: "Repeatability",
              action:
                "Check whether you can repeat the work within your available time, cost limits and quality standards.",
            },
          ],
          continueWhen: commercial
            ? "A relevant person agrees to a bounded paid trial, delivery fits your limits, and the feedback identifies a repeatable need."
            : "The work is useful to someone, you want to continue, and another trial fits your limits.",
          stopWhen:
            "People do not recognise the need, the work exceeds your limits, or delivery requires commitments you want to avoid.",
          commitment: "Small manual trial before new purchases",
          timeDemand: time
            ? compact(time.quote, 100)
            : "Available time still needs confirmation",
          status: "hypothesis" as const,
        }))
    : recommendations
        .filter((r) => !r.optional)
        .map((r) => ({
          id: r.serviceId,
          title: r.solution,
          summary: r.problem,
          basis: facts
            .filter((f) =>
              r.evidence.some(
                (e) => e.includes(f.quote) || e.startsWith(`${f.sourceKey}:`),
              ),
            )
            .map((f) => f.id),
          why: r.problem,
          requirements: r.dependencies.filter(
            (x) => !x.startsWith("Reference "),
          ),
          risks: [
            r.confidence,
            ...r.dependencies.filter((x) => !x.startsWith("Reference ")),
          ],
          costToTest: r.estimate.notes,
          firstStep: r.nextSteps[0] ?? "Confirm the smallest useful scope.",
          validation: [
            {
              kind: "Current workflow",
              action:
                "Record the present steps and friction before making a change.",
            },
            {
              kind: "Fit",
              action:
                "Check an existing tool or manual alternative against the actual requirements.",
            },
            {
              kind: "Trial",
              action:
                "Test one small change and record its effect before expanding.",
            },
          ],
          continueWhen:
            "The trial addresses the reported problem within the agreed constraints.",
          stopWhen:
            "The tool does not meet required capabilities or adds more cost and work than it removes.",
          commitment: r.delivery,
          timeDemand: time
            ? compact(time.quote, 100)
            : "Confirm setup and ongoing maintenance time",
          status: "hypothesis" as const,
        }));
  if (exploratory && !directions.length) {
    for (const [id, title, summary] of [
      [
        "service",
        "A small service experiment",
        "Notice one task someone finds difficult; test whether you can help within your actual abilities.",
      ],
      [
        "product",
        "A product experiment",
        "Sketch a possible product without buying stock; check the problem before making anything.",
      ],
      [
        "content",
        "A sharing or teaching experiment",
        "Choose a topic you know or want to learn, then test one useful explanation.",
      ],
    ]) {
      if (
        a.opportunityStyle &&
        a.opportunityStyle !== "explore" &&
        a.opportunityStyle !== id
      )
        continue;
      if (id === "product" && /avoid.*stock|no stock/i.test(text)) continue;
      directions.push({
        id,
        title,
        summary,
        basis: [],
        why: "Your capabilities are not specific enough yet to favour this direction. Treat it as an illustrative example to explore.",
        requirements: ["Choose a task that matches your actual ability"],
        risks: ["Personal fit and demand are unverified"],
        costToTest:
          "Use existing resources and do not commit money before deciding what to learn.",
        firstStep:
          "Ask one possible user about a task or problem before proposing a solution.",
        validation: [
          {
            kind: "Problem",
            action: "Understand the existing problem before offering work.",
          },
          { kind: "Ability", action: "Try one small sample." },
          {
            kind: "Willingness to pay",
            action:
              "If income is your goal, test a scoped paid pilot separately from free feedback.",
          },
        ],
        continueWhen:
          "There is useful feedback and another trial fits your constraints.",
        stopWhen:
          "The need is absent or the trial requires an unwanted commitment.",
        commitment: "Exploratory only",
        timeDemand: time ? compact(time.quote, 100) : "Time remains open",
        status: "hypothesis",
      });
    }
  }
  for (const d of directions) {
    const edit = live.edits[d.id];
    if (!edit) continue;
    if (edit.title) d.title = edit.title;
    if (edit.notes) {
      d.summary = edit.notes;
      d.firstStep = `Test your refined scope: ${edit.notes}`;
    }
    if (edit.decision && edit.decision !== "exploring")
      d.status = edit.decision;
  }
  directions.sort(
    (x, y) =>
      Number(["selected", "developing"].includes(y.status)) -
      Number(["selected", "developing"].includes(x.status)),
  );
  const unknowns = [
    ...(!facts.some((f) => /\d.*hours?|full.time/i.test(f.quote))
      ? ["What time can a trial realistically fit around?"]
      : []),
    ...(!facts.some((f) =>
      /budget|limited.*(?:money|fund|invest)|avoid.*(?:spend|subscription)|financial/i.test(
        f.quote,
      ),
    )
      ? ["What spending, if any, is acceptable for a trial?"]
      : []),
    ...(exploratory
      ? [
          "Who would benefit from the first narrowly defined offer?",
          ...(commercial
            ? ["What would make a paid pilot worthwhile for them?"]
            : []),
        ]
      : [
          "Which capability and ongoing costs should be verified before committing?",
        ]),
  ];
  const goal = facts.find((f) => f.kind === "goal");
  return enrichOperationalBrief(
    {
      requirements: projectRequirements(raw, states, workspace),
      version: 1,
      summary: goal
        ? `Start from your goal: ${compact(goal.quote, 180)}. ${directions.some((d) => d.basis.length) ? "The directions below build on your reported experience and constraints." : "The directions below are starting hypotheses; fit still needs testing."}`
        : "Choose a small next step from your current information; capability and demand claims remain provisional.",
      facts: facts.slice(0, 24),
      directions,
      conclusions: directions
        .filter((d) => d.basis.length)
        .map(
          (d) =>
            `${d.title} has a stated capability basis; that supports a small test, not a claim of demand or professional expertise.`,
        ),
      hypotheses: [
        "Proposed directions may be useful; customer interest and delivery feasibility require evidence.",
      ],
      unknowns,
      decisions: [
        ...Object.entries(live.edits)
          .filter(([, e]) => e.decision || e.notes || e.priority)
          .map(([id, e]) => ({
            title:
              e.title ??
              directions.find((d) => d.id === id)?.title ??
              projectRequirements(raw, states, workspace).find(
                (r) => r.id === id,
              )?.label ??
              id,
            notes:
              e.notes ??
              (e.priority ? `Requirement priority: ${e.priority}` : ""),
            status: e.priority ?? e.decision ?? "refined",
          })),
        ...live.additions.map((n) => ({
          title: n.title,
          notes: n.notes,
          status: n.kind,
        })),
      ],
    },
    a,
  );
}
