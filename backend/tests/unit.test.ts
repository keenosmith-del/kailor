import { describe, it, expect } from "vitest";
import {
  activeQuestions,
  nextQuestion,
  pruneAnswers,
  validateAnswer,
  questions,
} from "../src/discovery.js";
import { recommend, createReport } from "../src/assessment.js";
import {
  personas,
  scenarios,
  seededCases,
  matchCases,
} from "../src/library.js";
import {
  MockProvider,
  CloudflareProvider,
  inferSafely,
  budgetAvailable,
  remoteEnabled,
} from "../src/ai.js";
import { chatOutputSchema, type Answers } from "../../shared/src/index.js";
import { renderPdf } from "../src/pdf.js";
import { hashPassword, verifyPassword } from "../src/auth.js";
describe("versioned discovery", () => {
  it("starts with the four starting points", () => {
    expect(nextQuestion({})?.id).toBe("stage");
    expect(questions[0].options).toHaveLength(4);
  });
  it.each([
    ["established", "tools"],
    ["starting", "idea"],
    ["uncertain", "frustrations"],
    ["specific", "request"],
  ])("routes %s through %s", (stage, id) => {
    expect(activeQuestions({ stage }).map((q) => q.id)).toContain(id);
  });
  it("adds profession-specific questions", () =>
    expect(
      activeQuestions({ kind: "professional" }).map((q) => q.id),
    ).toContain("portfolio"));
  it("prunes irrelevant branch answers after edits", () => {
    const a = pruneAnswers({
      stage: "established",
      idea: "Old idea",
      presence: ["none"],
      website: "Old website",
      problems: ["credibility"],
      bookingDetails: "Old workflow",
      goals: "Keep this",
    });
    expect(a.idea).toBeUndefined();
    expect(a.website).toBeUndefined();
    expect(a.bookingDetails).toBeUndefined();
    expect(a.goals).toBe("Keep this");
  });
  it("validates option IDs, types, conflicts and required answers", () => {
    expect(() => validateAnswer("stage", "invalid")).toThrow();
    expect(() => validateAnswer("presence", ["none", "instagram"])).toThrow();
    expect(() => validateAnswer("industry", [])).toThrow();
    expect(() => validateAnswer("industry", "", true)).toThrow();
    expect(() => validateAnswer("budget", "", true)).not.toThrow();
  });
  it("allows supporting details to be skipped and still reaches assessment", () => {
    const a: Answers = {
      stage: "starting",
      kind: "professional",
      industry: "Designer",
      idea: "A design studio",
      presence: ["website"],
      problems: ["booking", "invoices", "content"],
      goals: "Simplify the work",
    };
    const skipped: string[] = [];
    let q = nextQuestion(a);
    while (q) {
      validateAnswer(q.id, "", true);
      skipped.push(q.id);
      a[q.id] = "";
      q = nextQuestion(a);
    }
    expect(skipped).toEqual([
      "progress",
      "portfolio",
      "website",
      "tools",
      "bookingDetails",
      "invoiceDetails",
      "contentDetails",
      "constraints",
      "budget",
      "timing",
    ]);
    expect(nextQuestion(a)).toBeNull();
    expect(recommend(a)).toEqual([]);
  });
  it.each(personas)("has a complete usable regression path: $id", (p) => {
    const a: Answers = {};
    let q = nextQuestion(a);
    while (q) {
      const v = (p.answers as Answers)[q.id];
      expect(v !== undefined || q.optional).toBeTruthy();
      validateAnswer(q.id, v ?? "", v === undefined);
      a[q.id] = v ?? "";
      q = nextQuestion(a);
    }
    expect(nextQuestion(a)).toBeNull();
  });
});
describe("evidence and reference knowledge", () => {
  it("has fifteen complete seed scenarios", () => {
    expect(scenarios).toHaveLength(15);
    for (const s of scenarios) {
      expect(s.evidenceRequirements.length).toBeGreaterThan(0);
      expect(s.unsuitableConditions.length).toBeGreaterThan(0);
    }
  });
  it("does not infer a solution from industry alone", () => {
    expect(recommend({ industry: "nail technician" })).toEqual([]);
    expect(matchCases({ industry: "beauty" }, seededCases)).toEqual([]);
  });
  it.each(personas)("respects recommendation fixture: $id", (p) => {
    const ids = recommend(p.answers as Answers).map((r) => r.serviceId);
    for (const id of p.expectedServices) expect(ids).toContain(id);
    for (const id of p.excludedServices) expect(ids).not.toContain(id);
  });
  it("excludes pending synthetic cases and explains approved matches", () => {
    const c = {
      ...seededCases[0],
      sourceType: "simulation",
      reviewStatus: "pending",
    };
    expect(matchCases({ problems: ["credibility"] }, [c])).toHaveLength(0);
    const matched = matchCases({ problems: ["credibility"] }, [
      { ...c, reviewStatus: "approved" },
    ]);
    expect(matched[0].sourceType).toBe("simulation");
    expect(matched[0].reasons[0]).toContain("Confirmed challenge");
  });
  it("leaves missing estimates for manual review, even with a rate but no scoped hours", () => {
    for (const r of recommend(personas[0].answers, {
      currency: "ZAR",
      hourlyRate: 500,
    })) {
      expect(r.estimate.status).toBe("manual_review");
      expect(r.estimate.implementationLow).toBeNull();
    }
  });
  it("requires detailed workflow evidence", () => {
    expect(recommend({ problems: ["booking", "invoices", "content"] })).toEqual(
      [],
    );
  });
  it("does not treat Not applicable as confirmed workflow or website detail", () => {
    expect(
      recommend({
        presence: ["website"],
        problems: ["outdated", "booking", "invoices", "content"],
        website: "Not applicable",
        bookingDetails: "Not applicable",
        invoiceDetails: "Not applicable",
        contentDetails: "Not applicable",
      }),
    ).toEqual([]);
  });
});
describe("AI boundaries", () => {
  it("explicit mock proposals preserve the original context", async () => {
    const context = { goals: "Original" };
    const result = await new MockProvider().infer(
      context,
      "set goals: New goal",
    );
    expect(result.reply).toContain("Development mode");
    expect(result.proposals[0].value).toBe("New goal");
    expect(context.goals).toBe("Original");
  });
  it("does not claim to extract facts from arbitrary prose", async () =>
    expect(
      (await new MockProvider().infer({}, "I want bookings")).proposals,
    ).toEqual([]));
  it("requires credentials and explicit opt-in", () =>
    expect(
      remoteEnabled({
        AI_PROVIDER: "cloudflare",
        AI_ALLOW_REMOTE: "false",
        CLOUDFLARE_ACCOUNT_ID: "test",
        CLOUDFLARE_API_TOKEN: "test",
      }),
    ).toBe(false));
  it("enforces session and daily call ceilings", () => {
    expect(budgetAvailable(5, 5, 5, 20)).toBe(false);
    expect(budgetAvailable(0, 20, 5, 20)).toBe(false);
    expect(budgetAvailable(0, 0, 0, 20)).toBe(false);
    expect(budgetAvailable(1, 1, 5, 20)).toBe(true);
  });
  it("rejects malformed structured responses", () =>
    expect(() =>
      chatOutputSchema.parse({
        reply: "hello",
        proposals: [{ key: "goals", value: 12 }],
      }),
    ).toThrow());
  const opts = {
    account: "test",
    token: "test",
    model: "@cf/test",
    maxTokens: 200,
    timeoutMs: 100,
  };
  it.each([429, 500])(
    "falls back safely on provider HTTP %s",
    async (status) => {
      const provider = new CloudflareProvider(
        opts,
        async () => new Response("", { status }),
      );
      const result = await inferSafely(
        provider,
        {},
        "Hello",
        [],
        "conversation",
      );
      expect(result.provider).toBe("mock-development");
      expect(result.fallbackReason).toBeTruthy();
    },
  );
  it("falls back on timeout and invalid JSON", async () => {
    for (const fetcher of [
      async () => {
        throw new DOMException("Timed out", "TimeoutError");
      },
      async () => Response.json({ result: { response: "invalid JSON" } }),
    ]) {
      const result = await inferSafely(
        new CloudflareProvider(opts, fetcher),
        {},
        "Hello",
        [],
        "analysis",
      );
      expect(result.provider).toBe("mock-development");
    }
  });
  it("validates structured facts against question options", async () => {
    const provider = new CloudflareProvider(opts, async () =>
      Response.json({
        result: {
          response: JSON.stringify({
            reply: "Here is a proposal",
            proposals: [{ key: "stage", value: "invented" }],
          }),
        },
      }),
    );
    expect(
      (await inferSafely(provider, {}, "Hello", [], "conversation")).provider,
    ).toBe("mock-development");
  });
  it("passes context and bounded output settings to the official REST contract", async () => {
    let body: any;
    const provider = new CloudflareProvider(opts, async (url, init) => {
      expect(String(url)).toContain("/client/v4/accounts/test/ai/run/@cf/test");
      body = JSON.parse(init!.body as string);
      return Response.json({
        success: true,
        result: {
          response: JSON.stringify({
            reply: "Clarify the goal",
            proposals: [],
          }),
        },
      });
    });
    await provider.infer({ tools: "WhatsApp" }, "Hello", [], "conversation");
    expect(body.max_tokens).toBe(200);
    expect(body.messages[0].content).toContain("WhatsApp");
  });
});
describe("report and authentication", () => {
  it("uses approved reference questions to refine next steps, never to create unsupported solutions", () => {
    const report = createReport(personas[0].answers, 1, true, seededCases);
    expect(
      report.recommendations.some((r) =>
        r.nextSteps.some((step) => step.includes("Reference-informed check")),
      ),
    ).toBe(true);
    expect(
      createReport({ industry: "beauty" }, 1, true, seededCases)
        .recommendations,
    ).toEqual([]);
  });
  it("uses the same evidence-backed recommendations in the snapshot and report sections", () => {
    const r = createReport(personas[0].answers, 4, true, seededCases);
    expect(r.sections).toHaveLength(7);
    expect(r.synthetic).toBe(true);
    expect(r.revision).toBe(4);
    for (const recommendation of r.recommendations)
      expect(r.sections[3].paragraphs.join(" ")).toContain(
        recommendation.evidence[0],
      );
  });
  it("generates a real PDF from the report snapshot", async () => {
    const pdf = await renderPdf(
      createReport(personas[0].answers, 4, true, seededCases),
    );
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(3000);
  });
  it("hashes and verifies passwords without plaintext storage", async () => {
    const hash = await hashPassword("a-long-test-password");
    expect(hash).not.toContain("a-long-test-password");
    expect(await verifyPassword("a-long-test-password", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

import { sameOrigin } from "../src/auth.js";
import { config } from "../src/config.js";
it("allows loopback hostname equivalents only in development on the configured port", () => {
  const configured = new URL(config.APP_ORIGIN);
  const environment = config.NODE_ENV;
  config.NODE_ENV = "development";
  try {
    for (const host of ["localhost", "127.0.0.1"]) {
      const origin = new URL(configured);
      origin.hostname = host;
      expect(() =>
        sameOrigin(
          { method: "POST", headers: { origin: origin.origin } } as any,
          {} as any,
          () => {},
        ),
      ).not.toThrow();
    }
    expect(() =>
      sameOrigin(
        {
          method: "POST",
          headers: { origin: "http://localhost.evil.example:5173" },
        } as any,
        {} as any,
        () => {},
      ),
    ).toThrow();
    config.NODE_ENV = "production";
    expect(() =>
      sameOrigin(
        {
          method: "POST",
          headers: { origin: "http://localhost.evil.example:5173" },
        } as any,
        {} as any,
        () => {},
      ),
    ).toThrow();
  } finally {
    config.NODE_ENV = environment;
  }
});
