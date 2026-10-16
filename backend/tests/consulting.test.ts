import { describe, expect, it } from "vitest";
import { consultingBrief } from "../src/consulting.js";
import { createReport } from "../src/assessment.js";
import { localReply } from "../src/conversation-guidance.js";
import { MockProvider } from "../src/ai.js";
import { planDiscovery } from "../src/discovery-planner.js";
import { canvasStateSchema } from "../../shared/src/consulting.js";
import type { Answers } from "../../shared/src/index.js";
import { exploratoryPersona } from "./consulting-fixture.js";
describe("grounded consulting projection", () => {
  it("turns the supplied circumstances into attributed, bounded directions", () => {
    const report = createReport(exploratoryPersona, 4, false, []),
      b = report.consulting!;
    expect(b.directions.map((d) => d.id)).toEqual(
      expect.arrayContaining([
        "visual-design",
        "coordination",
        "administration",
      ]),
    );
    for (const d of b.directions) {
      expect(d.basis.length).toBeGreaterThan(0);
      expect(d.basis.every((id) => b.facts.some((f) => f.id === id))).toBe(
        true,
      );
      expect(d.timeDemand).toContain("5–8");
      expect(d.why).toContain("limited money");
      expect(d.costToTest).toContain("Do not buy stock");
      expect(d.validation.map((v) => v.kind)).toEqual([
        "Interest",
        "Ability",
        "Problem",
        "Willingness to pay",
        "Repeatability",
      ]);
      expect(d.validation[3].action).toContain(
        "Free work alone does not validate",
      );
      expect(d.stopWhen).toContain("exceeds your limits");
    }
    expect(b.unknowns.join(" ")).not.toMatch(/What time|What spending/);
    expect(b.directions.map((d) => d.id)).not.toContain("product");
  });
  it("changes directions with capabilities and honours explicit exclusions", () => {
    const other = consultingBrief({
      ...exploratoryPersona,
      interests: "I enjoy gardening and repairing furniture.",
      strengths: "I repair furniture with my own tools.",
      constraints: "I do not want design or event planning work.",
    });
    expect(other.directions.map((d) => d.id)).toEqual(["practical-help"]);
    const excluded = consultingBrief({
      ...exploratoryPersona,
      constraints: "I want to avoid design work.",
    });
    expect(excluded.directions.some((d) => d.id === "visual-design")).toBe(
      false,
    );
  });
  it("does not invent experience from negation, uncertainty or a non-commercial goal", () => {
    const b = consultingBrief(
      {
        stage: "uncertain",
        motivation: "I want a creative hobby",
        strengths: "I have no experience in design",
        interests: "I don't know yet",
      },
      { interests: "unknown" },
    );
    expect(b.directions.every((d) => !d.basis.length)).toBe(true);
    expect(b.facts.some((f) => f.sourceKey === "interests")).toBe(false);
    expect(b.unknowns.join(" ")).not.toContain("paid pilot");
  });
  it("incorporates live constraints and decisions without mutating its inputs", () => {
    const raw = structuredClone(exploratoryPersona),
      workspace = {
        edits: {
          "visual-design": { title: "Invitations only", decision: "rejected" },
        },
        additions: [
          {
            id: crypto.randomUUID(),
            kind: "constraint",
            title: "No event responsibility",
            notes: "I want to avoid event planning work.",
          },
        ],
      };
    const b = consultingBrief(raw, {}, [], workspace);
    expect(b.directions.find((d) => d.id === "visual-design")).toMatchObject({
      title: "Invitations only",
      status: "rejected",
    });
    expect(b.directions.some((d) => d.id === "coordination")).toBe(false);
    expect(b.decisions.some((d) => d.title === "No event responsibility")).toBe(
      true,
    );
    expect(raw).toEqual(exploratoryPersona);
  });
  it("recalls all reported context and explains meaningful tests in local fallback", () => {
    const summary = localReply(
      exploratoryPersona,
      "Summarise everything learned about my situation",
      [],
    );
    for (const marker of [
      "Canva",
      "5–8",
      "smartphone",
      "limited money",
      "subscriptions",
      "not verified",
    ]) {
      if (marker !== "not verified") expect(summary).toContain(marker);
    }
    expect(summary).toContain("Still unverified");
    const reply = localReply(
      exploratoryPersona,
      "Explain the small design services experiment and costs",
      [],
    );
    expect(reply).toContain("Small design services");
    expect(reply).toContain("Willingness to pay");
  });
  it("applies technical communication preference in local explanations", async () => {
    const provider = new MockProvider(),
      consulting = consultingBrief(exploratoryPersona),
      plan = planDiscovery(exploratoryPersona);
    const technical = await provider.infer(
      exploratoryPersona,
      "Explain the experiments",
      [],
      "conversation",
      {
        plan,
        consulting,
        memory: {
          planId: "p",
          sessionId: "s",
          retrieved: [],
          preferences: [
            {
              key: "communicationStyle",
              revision: 0,
              value: "technical-detail",
            },
          ],
        },
      },
    );
    expect(technical.reply).toContain("Evidence trace:");
  });
  it("bounds persisted Canvas notes and rejects unknown state properties", () => {
    expect(
      canvasStateSchema.safeParse({ edits: {}, additions: [], owner: "other" })
        .success,
    ).toBe(false);
    expect(
      canvasStateSchema.safeParse({
        edits: { idea: { notes: "a".repeat(1201) } },
        additions: [],
      }).success,
    ).toBe(false);
  });
});

it("uses a preferred opportunity format rather than overriding it with a service offer", () => {
  const product = consultingBrief({
    ...exploratoryPersona,
    opportunityStyle: "product",
  });
  expect(
    product.directions.every((d) => d.title.endsWith("resources to test")),
  ).toBe(true);
  expect(
    product.directions.find((d) => d.id === "visual-design")?.firstStep,
  ).toContain("reusable template");
  const content = consultingBrief({
    ...exploratoryPersona,
    opportunityStyle: "content",
  });
  expect(
    content.directions.every((d) =>
      d.firstStep.includes("short demonstration"),
    ),
  ).toBe(true);
});

// Existing operations must retain scope decisions through all deterministic projections.
describe("operational consulting priorities", () => {
  it("separates the authoritative first phase, optional and deferred capabilities", async () => {
    const { logisticsPersona } = await import("./operations-fixture.js");
    const { projectRequirements } = await import("../src/requirements.js");
    const r = projectRequirements(logisticsPersona);
    expect(r.filter((x) => x.priority === "essential")).toHaveLength(10);
    expect(r.filter((x) => x.priority === "optional").map((x) => x.id)).toEqual(
      ["requirement-customer-links", "requirement-notifications"],
    );
    expect(r.filter((x) => x.priority === "deferred")).toHaveLength(4);
    expect(r.find((x) => x.id === "requirement-status-updates")?.priority).toBe(
      "essential",
    );
    expect(
      r.find((x) => x.id === "requirement-gps")?.provenance[0].quote,
    ).toContain("can wait");
  });
  it("produces a reasoned platform recommendation, practical pilot and canonical metadata", async () => {
    const { logisticsPersona } = await import("./operations-fixture.js");
    const { createReport } = await import("../src/assessment.js");
    const { canvasGraph } = await import("../src/canvas-model.js");
    const { localReply } = await import("../src/conversation-guidance.js");
    const report = createReport(logisticsPersona, 1, true, []);
    expect(report.title).toContain("Delivery operations");
    expect(report.recommendations[0].solution).toContain(
      "established delivery-management platform",
    );
    expect(report.consulting?.approaches).toHaveLength(3);
    expect(
      report.consulting?.directions[0].validation.map((v) => v.kind),
    ).toContain("Safe transition");
    expect(JSON.stringify(report)).not.toMatch(
      /data\/services.ts|willingness to pay|claim of demand/,
    );
    const graph = canvasGraph(logisticsPersona, report);
    expect(graph.nodes.find((n) => n.id === "requirement-gps")?.decision).toBe(
      "deferred",
    );
    const reply = localReply(
      logisticsPersona,
      "What do we need first, what would be nice to have later, and what have I explicitly postponed?",
      [],
      "conversation",
      undefined,
      undefined,
      [],
      undefined,
      report.consulting,
    );
    expect(reply).toContain("Essential first phase");
    expect(reply).toContain("Optional later");
    expect(reply).toContain("Explicitly postponed");
    expect(reply).toContain("Continuous GPS");
  });
  it("reconciles live priorities and development without mutating a saved report", async () => {
    const { logisticsPersona } = await import("./operations-fixture.js");
    const { createReport } = await import("../src/assessment.js");
    const old = createReport(logisticsPersona, 1, true, []);
    const saved = JSON.stringify(old);
    const updated = createReport(
      logisticsPersona,
      2,
      true,
      [],
      undefined,
      [],
      {},
      {
        edits: {
          "requirement-dashboard": { priority: "optional" },
          integration: {
            decision: "developing",
            notes: "Pilot with one coordinator and three drivers",
          },
        },
        additions: [],
      },
    );
    expect(
      updated.consulting?.requirements?.find(
        (r) => r.id === "requirement-dashboard",
      )?.priority,
    ).toBe("optional");
    expect(updated.consulting?.directions[0].status).toBe("developing");
    expect(updated.consulting?.directions[0].requirements).not.toContain(
      "Operations dashboard",
    );
    expect(JSON.stringify(old)).toBe(saved);
  });
  it("uses contextual authoritative option IDs and offers prioritisation instead of repeating roles", async () => {
    const { logisticsPersona } = await import("./operations-fixture.js");
    const { activeQuestions, validateAnswer } = await import(
      "../src/discovery.js"
    );
    const { planDiscovery } = await import("../src/discovery-planner.js");
    const q = activeQuestions(logisticsPersona).find(
      (q) => q.id === "problems",
    )!;
    expect(q.options?.some((o) => o.label.includes("proof"))).toBe(true);
    for (const option of q.options ?? [])
      expect(() => validateAnswer("problems", [option.value])).not.toThrow();
    const { scopeDetails, ...beforeScope } = logisticsPersona;
    const plan = planDiscovery({ ...beforeScope, problems: ["custom"] });
    expect(plan.active.find((q) => q.id === "scopeDetails")?.title).toContain(
      "Which must be in the first phase",
    );
  });
});
it("retains novel explicit requirements, flags contradictory priorities and applies confirmed corrections", async () => {
  const { projectRequirements } = await import("../src/requirements.js");
  const { extractCandidates } = await import("../src/context-extraction.js");
  const { logisticsPersona } = await import("./operations-fixture.js");
  expect(
    projectRequirements({
      stage: "specific",
      scopeDetails: "Essential: scheduled backups; audit access logs",
    }).some((r) => r.label.includes("backups") && r.priority === "essential"),
  ).toBe(true);
  const conflicting = projectRequirements({
    stage: "specific",
    scopeDetails: "GPS tracking is essential. GPS tracking is optional.",
  });
  expect(conflicting.find((r) => r.id === "requirement-gps")?.priority).toBe(
    "unconfirmed",
  );
  const correction = "Actually, live GPS tracking is now essential.";
  expect(extractCandidates(correction)).toContainEqual({
    key: "clarification",
    value: correction,
  });
  const updated = projectRequirements({
    ...logisticsPersona,
    clarification: correction,
  });
  expect(updated.find((r) => r.id === "requirement-gps")?.priority).toBe(
    "essential",
  );
  expect(updated.find((r) => r.id === "requirement-native-app")?.priority).toBe(
    "deferred",
  );
});
it("rejects model output that promotes a deferred capability and preserves explicitly qualified discussion", async () => {
  const { logisticsPersona } = await import("./operations-fixture.js");
  const { inferSafely } = await import("../src/ai.js");
  const report = createReport(logisticsPersona, 1, true, []);
  const knowledge = {
    plan: planDiscovery(logisticsPersona),
    consulting: report.consulting,
  };
  const bad = await inferSafely(
    {
      name: "contract-test",
      infer: async () => ({
        reply: "Real-time tracking is an essential feature for your pilot.",
        proposals: [],
      }),
    },
    logisticsPersona,
    "What do we need first?",
    [],
    "conversation",
    knowledge,
  );
  expect(bad.provider).toBe("mock-development");
  expect(bad.output.reply).toContain("Explicitly postponed");
  const good = await inferSafely(
    {
      name: "contract-test",
      infer: async () => ({
        reply:
          "Live GPS tracking remains deferred. Test driver-updated statuses in the first phase.",
        proposals: [],
      }),
    },
    logisticsPersona,
    "What do we need first?",
    [],
    "conversation",
    knowledge,
  );
  expect(good.provider).toBe("contract-test");
});
it("supplies complete structured scope to the model without truncating deferred requirements or decisions", async () => {
  const { consultingContext } = await import("../src/consulting-context.js");
  const { logisticsPersona } = await import("./operations-fixture.js");
  const report = createReport(
    logisticsPersona,
    1,
    true,
    [],
    undefined,
    [],
    {},
    { edits: { integration: { decision: "developing" } }, additions: [] },
  );
  const context = consultingContext(report.consulting)!;
  expect(
    context.requirements?.find((r) => r.id === "requirement-gps")?.priority,
  ).toBe("deferred");
  expect(context.decisions.some((d) => d.status === "developing")).toBe(true);
  expect(context.requirements).toHaveLength(16);
});
it("does not mistake system UUIDs for phone numbers while preserving sensitive user text checks", async () => {
  const { privacyScanText, containsSensitiveData } = await import(
    "../src/conversation-guidance.js"
  );
  const reference = "aaaaaaaa-aaaa-aaaa-aaaa-123456789012";
  expect(
    containsSensitiveData(
      privacyScanText({
        sourceMessageId: reference,
        summary: { excerpts: [{ source: reference }] },
      }),
    ),
  ).toBe(false);
  expect(
    containsSensitiveData(
      privacyScanText({
        sourceMessageId: reference,
        content: "Call +27 82 123 4567",
      }),
    ),
  ).toBe(true);
  expect(
    containsSensitiveData(privacyScanText({ content: "private@example.com" })),
  ).toBe(true);
});
it("sends complete requirement priorities and Canvas states through the existing Cloudflare envelope", async () => {
  const { CloudflareProvider } = await import("../src/ai.js");
  const { logisticsPersona } = await import("./operations-fixture.js");
  const report = createReport(
    logisticsPersona,
    1,
    true,
    [],
    undefined,
    [],
    {},
    { edits: { integration: { decision: "developing" } }, additions: [] },
  );
  let envelope: any;
  const provider = new CloudflareProvider(
    {
      account: "test",
      token: "test",
      model: "test",
      maxTokens: 600,
      timeoutMs: 1000,
    },
    async (_url, request) => {
      const body = JSON.parse(String(request?.body));
      envelope = JSON.parse(
        body.messages.find(
          (m: any) =>
            m.role === "user" &&
            m.content.includes("untrusted-session-context"),
        ).content,
      );
      return new Response(
        JSON.stringify({
          success: true,
          result: {
            response: JSON.stringify({
              reply: "The scope remains recorded.",
              proposals: [],
            }),
          },
        }),
      );
    },
  );
  await provider.infer(
    logisticsPersona,
    "What should the pilot test?",
    [],
    "conversation",
    { plan: planDiscovery(logisticsPersona), consulting: report.consulting },
  );
  expect(envelope.consultingGuidance.requirements).toHaveLength(16);
  expect(
    envelope.consultingGuidance.requirements.find(
      (r: any) => r.id === "requirement-gps",
    ).priority,
  ).toBe("deferred");
  expect(
    envelope.consultingGuidance.decisions.some(
      (d: any) => d.status === "developing",
    ),
  ).toBe(true);
});
it.each([
  [
    "Appointment scheduling and reminders",
    "Essential: appointment scheduling; automatic customer reminders; CSV exports.",
    "scheduling and reminder service",
  ],
  [
    "Retail inventory and ordering operations",
    "Essential: inventory management; operations dashboard; CSV exports.",
    "inventory and ordering platform",
  ],
  [
    "Professional client intake and document workflows",
    "Essential: client intake; document management; CSV exports.",
    "client workflow and document-management platform",
  ],
  [
    "Production scheduling and quality records",
    "Essential: production scheduling; quality records; CSV exports.",
    "production and quality-management platform",
  ],
])(
  "uses functional requirements for %s",
  (industry, scopeDetails, category) => {
    const report = createReport(
      {
        stage: "established",
        industry,
        goals:
          "Improve our operational records and reduce manual coordination.",
        scopeDetails,
      },
      1,
      true,
      [],
    );
    expect(report.recommendations[0].solution).toContain(category);
    expect(
      report.consulting?.requirements?.some((r) => r.priority === "essential"),
    ).toBe(true);
    expect(JSON.stringify(report)).not.toContain("willingness to pay");
  },
);
it("removes internal configuration text and malformed empty headings in the presentation without rewriting old JSON", async () => {
  const { customerReport } = await import("../../shared/src/report.js");
  const original = createReport(
    {
      stage: "established",
      industry: "I run a small bakery",
      goals: "Reduce repetitive invoice preparation",
      invoiceDetails: "I copy invoices from spreadsheets every week",
      problems: ["invoices"],
    },
    1,
    true,
    [],
  );
  original.sections.push({ title: "###", paragraphs: ["###"] });
  if (original.recommendations[0])
    original.recommendations[0].estimate.notes =
      "Consultant hours must be configured in data/services.ts.";
  const before = JSON.stringify(original);
  const displayed = customerReport(original);
  expect(JSON.stringify(displayed)).not.toContain("data/services.ts");
  expect(displayed.sections.every((s) => s.title && s.paragraphs.length)).toBe(
    true,
  );
  expect(JSON.stringify(original)).toBe(before);
});
it("uses live priorities for current planning while preserving explicit historical-report discussion", async () => {
  const { logisticsPersona } = await import("./operations-fixture.js");
  const old = createReport(logisticsPersona, 1, true, []);
  const live = createReport(
    logisticsPersona,
    2,
    true,
    [],
    undefined,
    [],
    {},
    { edits: { "requirement-gps": { priority: "essential" } }, additions: [] },
  );
  const currentReply = localReply(
    logisticsPersona,
    "What do we need first with our current priorities?",
    [],
    "conversation",
    undefined,
    undefined,
    [],
    old,
    live.consulting,
  );
  expect(currentReply.split("Optional later:")[0]).toContain("Continuous GPS");
  const historical = localReply(
    logisticsPersona,
    "What was postponed in this saved report?",
    [],
    "conversation",
    undefined,
    undefined,
    [],
    old,
    live.consulting,
  );
  expect(historical.split("Explicitly postponed:")[1]).toContain(
    "Continuous GPS",
  );
});
it("rejects inventing a public service business from an internal inspection workflow", async () => {
  const { inferSafely } = await import("../src/ai.js");
  const context = {
    stage: "specific",
    request:
      "I inspect machinery and want staff to record work offline from phones",
  };
  const result = await inferSafely(
    {
      name: "contract-test",
      infer: async () => ({
        reply:
          "You want a website for presenting your machinery inspection services and receiving enquiries.",
        proposals: [],
      }),
    },
    context,
    "I want a website for the first version.",
    [],
    "conversation",
    { plan: planDiscovery(context) },
  );
  expect(result.provider).toBe("mock-development");
  expect(result.output.reply).not.toContain(
    "presenting your machinery inspection services",
  );
});
