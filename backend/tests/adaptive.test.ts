import { describe, it, expect } from "vitest";
import { planDiscovery } from "../src/discovery-planner.js";
import {
  buildContext,
  extractCandidates,
  signalAnswers,
} from "../src/context-extraction.js";
import { recommend, createReport } from "../src/assessment.js";
import { matchCases, seededCases } from "../src/library.js";
import { inferSafely } from "../src/ai.js";
import { pruneAnswers, validateAnswer } from "../src/discovery.js";
import type { Answers } from "../../shared/src/index.js";

describe("adaptive intelligence behavioral evaluation", () => {
  it.each([
    ["specific", "request"],
    ["starting", "idea"],
    ["uncertain", "frustrations"],
    ["established", "industry"],
  ])("starts %s at %s", (stage, id) =>
    expect(planDiscovery({ stage }).question?.id).toBe(id),
  );
  it("recognizes a described booking workflow without generic kind or tools questions", () => {
    const a = {
      stage: "established",
      industry:
        "I am a nail technician working alone. I advertise on Instagram and take appointments through WhatsApp.",
    };
    expect(planDiscovery(a).question?.id).toBe("bookingDetails");
    expect(signalAnswers(a).presence).toEqual(["instagram"]);
    expect(signalAnswers(a).tools).toContain("WhatsApp");
    expect(buildContext(a).facts.map((f) => f.key)).not.toContain("tools");
    expect(buildContext(a).possibilities.map((f) => f.key)).toContain("tools");
  });
  it("scopes an exact lesson application before generic business presence", () => {
    const a = {
      stage: "specific",
      request:
        "I need a web application that allows teachers to create weekly lesson plans from approved templates.",
    };
    const plan = planDiscovery(a);
    expect(plan.question?.id).toBe("scopeDetails");
    expect(plan.question?.hint).toContain("curriculum");
    expect(plan.readiness.canAssess).toBe(true);
    expect(recommend(a).map((r) => r.serviceId)).toContain("webapp");
    expect(recommend(a).map((r) => r.serviceId)).not.toContain("website");
  });
  it("investigates unfamiliar fleet operations without a seeded scenario", () => {
    const a = {
      stage: "established",
      industry:
        "I coordinate maintenance for a small fleet of delivery vehicles and need a better way to manage inspections and repairs.",
      goals: "Manage inspections and repairs",
    };
    expect(planDiscovery(a).question?.id).toBe("workflowDetails");
    const report = createReport(a, 1, true, []);
    expect(report.recommendations.map((r) => r.serviceId)).toEqual([
      "integration",
    ]);
    expect(report.recommendations[0].nextSteps.join(" ")).toContain(
      "Specialist",
    );
    expect(report.matchedCases).toEqual([]);
  });
  it("recognizes only a preliminary direction while optional inputs stay unknown", () => {
    const a = {
      request:
        "I need a web application for customers to schedule appointments",
      stage: "specific",
    };
    expect(planDiscovery(a).readiness.state).toBe(
      "available_with_uncertainties",
    );
    expect(planDiscovery(a).readiness.uncertainties.join(" ")).toContain(
      "budget",
    );
    expect(planDiscovery({ industry: "Teacher" }).readiness.canAssess).toBe(
      false,
    );
  });
  it("does not repeat indirectly described objectives", () => {
    const a = {
      stage: "established",
      industry:
        "I run a design studio and I want a portfolio to showcase completed work",
      constraints: "A small simple site",
      presence: ["none"],
      tools: "No current tools",
    };
    expect(planDiscovery(a).question).toBeNull();
    expect(planDiscovery(a).ranking.map((r) => r.id)).not.toContain("goals");
    expect(recommend(a).map((r) => r.serviceId)).toContain("portfolio");
  });
  it("avoids all repeated questions on a completed path", () => {
    const a: Answers = {
      stage: "specific",
      request: "I need a web application for approved templates",
      scopeDetails: "Teachers, weekly plans, exports and review",
      constraints: "Privacy and a small pilot",
    };
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const q = planDiscovery(a).question;
      if (!q) break;
      expect(seen.has(q.id)).toBe(false);
      seen.add(q.id);
      a[q.id] = "";
    }
    expect(planDiscovery(a).question).toBeNull();
  });
  it("respects explicit rejection of a website and complex AI", () => {
    const a = {
      industry: "Independent nail technician",
      problems: ["credibility"],
      goals: "A professional presence",
      constraints: "I do not want a website or AI; I need something affordable",
      presence: ["instagram"],
    };
    expect(recommend(a).map((r) => r.serviceId)).not.toContain("website");
    expect(recommend(a).map((r) => r.serviceId)).not.toContain("ai");
    expect(recommend(a)[0].nextSteps.join(" ")).toContain("affordable");
  });
  it("improves an existing booking system rather than blindly installing another", () => {
    const a = {
      industry: "Service business",
      problems: ["booking"],
      presence: ["website"],
      tools: "I already use a booking system",
      bookingDetails: "Missed appointment reminders",
      goals: "Reduce cancellations",
    };
    expect(recommend(a).map((r) => r.serviceId)).toEqual(["integration"]);
    expect(recommend(a)[0].alternatives.join(" ")).toContain("existing");
  });
  it("uses confirmed raw text as evidence instead of invented derived facts", () => {
    const a = {
      industry:
        "I am a nail technician. I advertise on Instagram and take appointments through WhatsApp.",
      goals:
        "I mostly want a better professional presence and an easier way for customers to book",
      constraints:
        "I don't want a complicated app. I need something affordable",
    };
    const r = recommend(a);
    expect(r.map((r) => r.serviceId)).toEqual(
      expect.arrayContaining(["website", "booking"]),
    );
    expect(r.map((r) => r.serviceId)).not.toContain("webapp");
    for (const rec of r)
      for (const e of rec.evidence) expect(e).not.toMatch(/^problems:/);
  });
  it("does not treat a hypothetical technology as a stated requirement", () =>
    expect(
      extractCandidates("Maybe I want a mobile app if I had more customers"),
    ).toEqual([]));
  it("captures negation and existing presence accurately", () => {
    expect(extractCandidates("I don't have a website.")).toContainEqual({
      key: "websiteStatus",
      value: "absent",
    });
    expect(extractCandidates("I already have a website.")).toContainEqual({
      key: "presence",
      value: ["website"],
    });
    expect(
      signalAnswers({ industry: "I want a portfolio", problems: ["none"] })
        .problems,
    ).toEqual(["none"]);
  });
  it("tracks website evidence stages without inventing a technical inspection", () => {
    validateAnswer("websiteUrl", "https://example.com");
    expect(() => validateAnswer("websiteUrl", "file:///etc/passwd")).toThrow();
    expect(() =>
      validateAnswer("websiteUrl", "https://user:pass@example.com"),
    ).toThrow();
    expect(buildContext({ websiteUrl: "https://example.com" }).website).toEqual(
      {
        supplied: "https://example.com",
        syntaxValidated: true,
        fetched: false,
        inspected: false,
      },
    );
  });
  it("retains indirectly relevant branch details and prunes explicit branch changes", () => {
    expect(
      pruneAnswers({
        industry: "I take appointments through WhatsApp",
        bookingDetails: "Manual reminders",
      }).bookingDetails,
    ).toBeDefined();
    expect(
      pruneAnswers({
        industry: "I take appointments through WhatsApp",
        problems: ["none"],
        bookingDetails: "Manual reminders",
      }).bookingDetails,
    ).toBeUndefined();
  });
  it("retrieves across industry by problem while industry alone is insufficient", () => {
    const pattern = {
      ...seededCases[0],
      id: "approved-booking",
      pattern: {
        industry: "beauty",
        problems: ["booking"],
        tools: [],
        goals: [],
        patterns: ["booking"],
        discoveryQuestions: ["How do cancellations work?"],
      },
    };
    const m = matchCases({ industry: "Fitness", problems: ["booking"] }, [
      pattern,
    ]);
    expect(m[0].reasons[0]).toContain("booking");
    expect(m[0].limitations.length).toBeGreaterThan(0);
    expect(
      matchCases({ industry: "beauty", problems: ["invoices"] }, [pattern]),
    ).toEqual([]);
    expect(
      matchCases({ tools: "Instagram and WhatsApp" }, seededCases),
    ).toEqual([]);
  });
  it("validates every provider, including custom implementations", async () => {
    for (const proposals of [
      [{ key: "privilege", value: "admin" }],
      [
        { key: "goals", value: "a" },
        { key: "goals", value: "b" },
      ],
    ]) {
      const r = await inferSafely(
        {
          name: "bad-provider",
          infer: async () => ({ reply: "Bad", proposals }),
        },
        {},
        "Hello",
        [],
        "conversation",
      );
      expect(r.fallbackReason).toBeTruthy();
    }
  });
  it("stores explainable priorities and deterministic provenance without confidence probabilities", () => {
    const a = {
      stage: "established",
      industry: "Small invoicing business",
      problems: ["invoices"],
    };
    const p = planDiscovery(a, 4, [], seededCases);
    expect(p).toEqual(planDiscovery(a, 4, [], seededCases));
    expect(p.ranking[0].reasons.length).toBeGreaterThan(0);
    expect(p.provenance.source).toBe("deterministic");
  });
});
