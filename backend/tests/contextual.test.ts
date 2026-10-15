import { describe, it, expect, vi, afterEach } from "vitest";
import {
  intelligenceMatrix,
  learningEvaluation,
  learningPattern,
} from "../src/intelligence-evaluation.js";
import { planDiscovery } from "../src/discovery-planner.js";
import { buildContext, extractCandidates } from "../src/context-extraction.js";
import { createReport, recommend } from "../src/assessment.js";
import { inferSafely, CloudflareProvider } from "../src/ai.js";
import {
  containsSensitiveData,
  localReply,
} from "../src/conversation-guidance.js";
import { validateAnswer } from "../src/discovery.js";
import { matchCases } from "../src/library.js";
import type { Answers } from "../../shared/src/index.js";
const field: Answers = {
  stage: "specific",
  request:
    "I inspect agricultural machinery and want technicians to record service work from phones with no internet connection",
};

describe("independent contextual evaluation", () => {
  it.each(intelligenceMatrix())("$id", (c) => {
    expect(c.failureReason).toBe("");
    expect(c.passed).toBe(true);
  });
  it("records an independently useful learning difference, not retrieval alone", () => {
    const result = learningEvaluation();
    expect(result.result).toBe("improved");
    expect(result.baseline.question).toBe("scopeDetails");
    expect(result.withApprovedReference.question).toBe("bookingCapabilities");
    expect(result.acceptancePassed).toBe(true);
  });
  it("unapproved references cannot influence facts, questions or solutions", () => {
    const rejected = { ...learningPattern, reviewStatus: "pending" };
    const result = learningEvaluation(rejected);
    expect(result.withApprovedReference.report.matchedCases).toEqual([]);
    expect(result.result).toBe("no_effect");
    expect(result.withApprovedReference.question).toBe(
      result.baseline.question,
    );
  });
  it("same-industry unrelated patterns have no useful match", () => {
    expect(
      matchCases(field, [
        {
          ...learningPattern,
          pattern: {
            ...learningPattern.pattern,
            industry: "agricultural",
            problems: ["booking"],
            goals: [],
            tools: [],
          },
        },
      ]),
    ).toEqual([]);
  });
  it("a harmful reference cannot add website or AI services to offline requirements", () => {
    const harmful = {
      ...learningPattern,
      pattern: {
        ...learningPattern.pattern,
        problems: [],
        goals: [],
        scope: ["record"],
        patterns: ["website", "ai"],
      },
    };
    const result = createReport(field, 1, true, [harmful]);
    expect(result.recommendations.map((r) => r.serviceId)).toEqual([
      "integration",
    ]);
    expect(
      result.recommendations[0].alternatives.some((a) =>
        a.includes("Create a presentation website"),
      ),
    ).toBe(false);
  });
  it("does not repeat skips and retains stable question definitions", () => {
    const skipped = { ...field, offlineDetails: "" };
    const plan = planDiscovery(skipped, 8, [], [], {
      offlineDetails: "skipped",
    });
    expect(plan.question?.id).not.toBe("offlineDetails");
    expect(plan.ranking.some((r) => r.id === "offlineDetails")).toBe(false);
    expect(
      planDiscovery(skipped, 8, [], [], { offlineDetails: "skipped" }),
    ).toEqual(plan);
    expect(
      validateAnswer(
        "offlineDetails",
        "Capture jobs locally and sync on return",
      ).type,
    ).toBe("text");
  });
  it("keeps unrelated goals separate and supports both outcomes", () => {
    const a = {
      industry: "Independent consultant",
      goals: "I want a portfolio and invoice automation",
      invoiceDetails: "I manually copy totals into invoices weekly",
    };
    const context = buildContext(a);
    expect(context.objectives.length).toBe(2);
    expect(recommend(a).map((r) => r.serviceId)).toEqual(
      expect.arrayContaining(["portfolio", "automation"]),
    );
  });
  it("does not turn an offline possibility into a factual requirement", () => {
    const a = {
      industry:
        "I am a photographer. I want a portfolio. What if I wanted offline operation?",
    };
    expect(extractCandidates("What if I wanted offline operation?")).toEqual(
      [],
    );
    const context = buildContext(a);
    expect(context.statements?.some((s) => s.status === "hypothetical")).toBe(
      true,
    );
    expect(context.dimensions).not.toContain("offline");
  });
  it("distinguishes a tentative website comparison from an app cancellation", () => {
    expect(
      extractCandidates("Actually, I think a simple website might be enough."),
    ).toEqual([]);
    expect(extractCandidates("I don't need an app anymore.")).toContainEqual({
      key: "appPreference",
      value: "declined",
    });
    expect(
      localReply(
        { request: "I want a mobile app" },
        "Actually, I think a simple website might be enough.",
        [],
      ),
    ).toContain("comparing");
  });
  it("confirmed application refusal overrides historical application descriptions", () => {
    const a = {
      request:
        "I want a mobile application for customers to upload project images",
      appPreference: "declined",
    };
    expect(recommend(a).map((r) => r.serviceId)).not.toContain("webapp");
    expect(
      planDiscovery(a).ranking.some((r) =>
        ["firstVersion", "scopeDetails"].includes(r.id),
      ),
    ).toBe(false);
  });
  it.each([
    "Can I keep using my current software?",
    "Wouldn't an existing tool be easier?",
    "That sounds too expensive.",
    "I actually want to start with something smaller.",
  ])("responds naturally without facts to advice: %s", (message) => {
    expect(extractCandidates(message)).toEqual([]);
    expect(localReply(field, message, []).length).toBeGreaterThan(40);
  });
  it("unknown response states are never promoted to confirmed context", () => {
    const plan = planDiscovery(
      { ...field, offlineDetails: "Devices might need local records" },
      1,
      [],
      [],
      { offlineDetails: "unknown" },
    );
    expect(plan.context.facts.some((f) => f.key === "offlineDetails")).toBe(
      false,
    );
    expect(
      plan.context.statements?.find((s) => s.sourceKey === "offlineDetails")
        ?.status,
    ).toBe("unverified");
    expect(plan.context.openQuestions).not.toContain("offlineDetails");
  });
  it("does not treat desired technology as current tools", () => {
    expect(extractCandidates("I want to use a booking provider")).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "bookingStatus", value: "existing" }),
      ]),
    );
    expect(extractCandidates("I want to have a website")).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "websiteStatus", value: "existing" }),
      ]),
    );
    expect(extractCandidates("I want to use a booking platform")).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "tools" })]),
    );
    expect(extractCandidates("I already use a booking platform")).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "tools" })]),
    );
  });
  it("does not prioritize unrelated reference questions ahead of offline feasibility", () => {
    const a = {
      ...field,
      bookingStatus: "existing",
      bookingDetails: "Manual bookings have missed reminders",
      problems: ["booking"],
    };
    expect(planDiscovery(a, 1, [], [learningPattern]).question?.id).toBe(
      "offlineDetails",
    );
  });
  it("negated offline scope is not a technical requirement", () => {
    expect(
      buildContext({
        request:
          "I do not need offline operation. I want an online-only record tool.",
      }).dimensions,
    ).not.toContain("offline");
  });
  it("has relevant suggestions rather than fixed filler", () => {
    expect(planDiscovery(field).suggestedPrompts.join(" ")).toContain(
      "offline",
    );
    expect(
      planDiscovery({
        industry: "Independent accounts clerk",
        invoiceDetails: "I copy invoice totals manually every week",
        goals: "Reduce repetitive invoice work",
      }).suggestedPrompts.join(" "),
    ).toContain("replacing my tools");
  });
});

describe("untrusted model boundary", () => {
  const provider = (output: unknown) => ({
    name: "cloudflare",
    infer: async () => output as any,
  });
  it.each([
    { reply: "Your website uses Shopify and is outdated.", proposals: [] },
    {
      reply: "I inspected your website and found broken pages.",
      proposals: [],
    },
    { reply: "This will cost ZAR 25000.", proposals: [] },
    { reply: "I am a medical specialist.", proposals: [] },
    {
      reply: "We can discuss options.",
      proposals: [
        {
          key: "scopeDetails",
          value: "Offline synchronization is confirmed",
          quote: "I need forms",
        },
      ],
    },
    {
      reply: "We can discuss options.",
      proposals: [
        { key: "websiteStatus", value: "existing", quote: "I need forms" },
      ],
    },
    {
      reply: "We can discuss options.",
      proposals: [
        {
          key: "workflowDetails",
          value: "What if I wanted offline records?",
          quote: "What if I wanted offline records?",
        },
      ],
    },
    {
      reply: "We can discuss options.",
      proposals: [],
      followUp: {
        questionId: "budget",
        title: "What is your investment?",
        hint: "Give a number to proceed.",
      },
    },
  ])(
    "falls back on fabricated, hypothetical or unrelated output %#",
    async (output) => {
      const result = await inferSafely(
        provider(output),
        field,
        "I need forms. What if I wanted offline records?",
        [],
        "conversation",
        { plan: planDiscovery(field) },
      );
      if (output.proposals.length) {
        expect(result.provider).toBe("cloudflare");
        expect(result.output.proposals).toEqual([]);
        expect(result.output.reply).toBe(output.reply);
      } else {
        expect(result.provider).toBe("mock-development");
        expect(result.fallbackReason).toBeTruthy();
      }
    },
  );
  it("allows rewording only the current contextual gap when explicitly requested", async () => {
    const plan = planDiscovery(field);
    const result = await inferSafely(
      provider({
        reply: "Let us clarify connection requirements.",
        proposals: [],
        followUp: {
          questionId: "offlineDetails",
          title: "Which tasks need to work offline?",
          hint: "Describe local records and synchronization when internet returns.",
        },
      }),
      field,
      "Ask me a useful follow-up question",
      [],
      "conversation",
      { plan },
    );
    expect(result.provider).toBe("cloudflare");
    expect(result.output.followUp?.questionId).toBe("offlineDetails");
  });
  it("rejects repeated model replies", async () => {
    const reply = "Could you share more details?";
    expect(
      (
        await inferSafely(
          provider({ reply, proposals: [] }),
          field,
          "Explain options",
          [{ role: "assistant", content: reply }],
          "conversation",
        )
      ).fallbackReason,
    ).toBeTruthy();
  });
  it("bounds provider history and minimizes unnecessary address/budget fields", async () => {
    let sent = "";
    const p = new CloudflareProvider(
      {
        account: "test",
        token: "test",
        model: "model",
        maxTokens: 128,
        timeoutMs: 100,
      },
      async (_url, input) => {
        sent = String(input?.body);
        return new Response(
          JSON.stringify({
            result: {
              response: JSON.stringify({
                reply: "Which task should change?",
                proposals: [],
              }),
            },
          }),
          { status: 200 },
        );
      },
    );
    await p.infer(
      { ...field, websiteUrl: "https://private.example", budget: "R500" },
      "Clarify the records",
      [{ role: "user", content: "Old private note" }],
      "conversation",
    );
    expect(sent).toContain("Old private note");
    expect(sent).not.toContain("private.example");
    expect(sent).not.toContain("R500");
  });
  it("keeps sensitive contexts local before an HTTP call", async () => {
    let calls = 0;
    const p = new CloudflareProvider(
      {
        account: "test",
        token: "test",
        model: "model",
        maxTokens: 128,
        timeoutMs: 100,
      },
      async () => {
        calls++;
        throw new Error("must not call");
      },
    );
    expect(
      (
        await inferSafely(
          p,
          { tools: "patient name: Example Patient" },
          "I need forms",
          [],
          "conversation",
        )
      ).provider,
    ).toBe("mock-development");
    expect(calls).toBe(0);
    expect(containsSensitiveData("patient name: Example Patient")).toBe(true);
  });
});

describe("draft lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  async function storage() {
    const saved: Record<string, string> = {};
    const proxy = new Proxy(saved, {
      get(target, key) {
        if (key === "getItem") return (k: string) => target[k] ?? null;
        if (key === "setItem")
          return (k: string, v: string) => {
            target[k] = v;
          };
        if (key === "removeItem")
          return (k: string) => {
            delete target[k];
          };
        return target[String(key)];
      },
    });
    vi.stubGlobal("sessionStorage", proxy);
    return await import("../../frontend/src/utils/drafts.js");
  }
  it("retains unsent text for a mode switch at the same knowledge revision", async () => {
    const d = await storage();
    d.saveDraft("session", 4, "conversation", "Unsent question");
    expect(d.readDraft("session", 4, "conversation")).toBe("Unsent question");
  });
  it("retires a draft after confirmed knowledge changes", async () => {
    const d = await storage();
    d.saveDraft("session", 4, "offlineDetails", "Offline notes");
    expect(d.readDraft("session", 5, "offlineDetails")).toBeUndefined();
  });
  it("expires text after thirty minutes", async () => {
    vi.useFakeTimers();
    const d = await storage();
    d.saveDraft("session", 4, "conversation", "Private draft");
    vi.advanceTimersByTime(30 * 60 * 1000);
    d.pruneDrafts();
    expect(Object.keys(sessionStorage)).toHaveLength(0);
  });
  it("clears only the restarted session, then all drafts on logout", async () => {
    const d = await storage();
    d.saveDraft("one", 1, "conversation", "First");
    d.saveDraft("two", 1, "conversation", "Second");
    d.clearDrafts("one");
    expect(d.readDraft("one", 1, "conversation")).toBeUndefined();
    expect(d.readDraft("two", 1, "conversation")).toBe("Second");
    d.clearDrafts();
    expect(Object.keys(sessionStorage)).toHaveLength(0);
  });
  it("works with storage disabled", async () => {
    const d = await storage();
    vi.stubGlobal("sessionStorage", undefined);
    expect(() =>
      d.saveDraft("session", 1, "conversation", "Text"),
    ).not.toThrow();
    expect(d.readDraft("session", 1, "conversation")).toBeUndefined();
  });
});
