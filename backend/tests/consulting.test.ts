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
