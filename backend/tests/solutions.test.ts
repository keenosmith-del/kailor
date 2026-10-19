import { expect, it } from "vitest";
import { createReport } from "../src/assessment.js";
import { evaluateReadiness } from "../src/discovery-readiness.js";
import { projectSolutions } from "../../shared/src/solutions.js";
import { emptyCanvasState } from "../../shared/src/consulting.js";
import { logisticsPersona } from "./operations-fixture.js";
import { requestInput } from "../src/solution-routes.js";
import type { Answers } from "../../shared/src/index.js";
const website: Answers = {
  stage: "established",
  kind: "business",
  industry: "I run a small plumbing business.",
  goals:
    "I need a professional website where customers can learn about my services and contact me.",
};
const solutions = (a: Answers, state = emptyCanvasState()) =>
  projectSolutions(
    createReport(a, 1, true, [], undefined, [], {}, state),
    state,
    1,
  );
it("shows one actual website recommendation, excluding supporting email setup", () => {
  const result = solutions(website);
  expect(result.map((s) => s.title)).toEqual(["Build a website"]);
  expect(result[0].visual).toBe("website");
  expect(result[0].facts.length).toBeGreaterThan(0);
});
it("recognises explicit website and Instagram requests independently", () => {
  const a = {
    ...website,
    goals: "I need a website and help setting up my business Instagram page.",
  };
  expect(evaluateReadiness(a).canAssess).toBe(true);
  expect(solutions(a).map((s) => s.visual)).toEqual(["social", "website"]);
});
it("does not propose Instagram merely because it exists or is declined", () => {
  expect(
    solutions({ ...website, tools: "We advertise on Instagram." }).some(
      (s) => s.id === "instagram",
    ),
  ).toBe(false);
  expect(
    solutions({
      ...website,
      goals: "I do not want Instagram. I need a professional website.",
    }).some((s) => s.id === "instagram"),
  ).toBe(false);
});
it("groups logistics capabilities and preserves explicitly deferred requirements", () => {
  const result = solutions(logisticsPersona);
  expect(result).toHaveLength(1);
  expect(result[0].title).toBe("Delivery management platform");
  expect(
    result[0].requirements.find((r) => r.id.includes("gps"))?.priority,
  ).toBe("deferred");
  expect(
    result[0].requirements.find((r) => r.id.includes("routing"))?.priority,
  ).toBe("deferred");
});
it("does not invalidate a selection through its own save or a session revision", () => {
  const report = createReport(website, 1, true, []);
  const s = projectSolutions(report, emptyCanvasState(), 1)[0];
  const state = {
    ...emptyCanvasState(),
    edits: { [s.id]: { decision: "selected" as const } },
    selections: {
      [s.id]: {
        selected: true,
        basisRevision: s.revision,
        updatedAt: new Date().toISOString(),
      },
    },
  };
  const result = projectSolutions(
    createReport(website, 2, true, [], undefined, [], {}, state),
    state,
    2,
  )[0];
  expect(result.selected).toBe(true);
  expect(result.reviewRequired).toBe(false);
});
it("retains selected solutions and requests reconciliation after a material edit", () => {
  const s = solutions(website)[0];
  const state = {
    ...emptyCanvasState(),
    edits: { [s.id]: { title: "A different website scope" } },
    selections: {
      [s.id]: {
        selected: true,
        basisRevision: s.revision,
        updatedAt: new Date().toISOString(),
      },
    },
  };
  const result = solutions(website, state)[0];
  expect(result.selected).toBe(true);
  expect(result.reviewRequired).toBe(true);
});
it("fact correction re-evaluates the current proposal without modifying its historical report", () => {
  const report = createReport(website, 1, true, []);
  const before = JSON.stringify(report);
  const result = solutions({
    ...website,
    goals:
      "I already have a website. I actually need an online booking system.",
    websiteStatus: "existing",
    bookingStatus: "absent",
  });
  expect(result.some((s) => s.id === "website")).toBe(false);
  expect(result.some((s) => s.id === "booking")).toBe(true);
  expect(JSON.stringify(report)).toBe(before);
});
it("keeps user-authored solutions distinct and does not manufacture definitive empty recommendations", () => {
  expect(solutions({})).toEqual([]);
  const result = solutions(
    {},
    {
      edits: {},
      additions: [
        {
          id: "d77db879-3581-49f5-b45a-86ee3980d915",
          kind: "idea",
          title: "Customer mobile application",
          notes: "Explore customer access to my services.",
        },
      ],
    },
  );
  expect(result).toHaveLength(1);
  expect(result[0].source).toBe("user");
});
it("rejects duplicate scope, arbitrary request fields and empty requests", () => {
  const input = {
    sessionId: crypto.randomUUID(),
    requestKey: crypto.randomUUID(),
    projectRevision: 1,
    solutions: [{ id: "website", revision: 1 }],
    notes: "",
  };
  expect(requestInput.safeParse(input).success).toBe(true);
  expect(
    requestInput.safeParse({
      ...input,
      solutions: [...input.solutions, ...input.solutions],
    }).success,
  ).toBe(false);
  expect(requestInput.safeParse({ ...input, ownerId: "other" }).success).toBe(
    false,
  );
  expect(requestInput.safeParse({ ...input, solutions: [] }).success).toBe(
    false,
  );
});
it("carries user-scoped capabilities into future assessments and keeps unrelated proposals separate", () => {
  const id = crypto.randomUUID();
  const state = {
    edits: {
      website: {
        capabilities: [
          {
            id,
            label: "Service area enquiry form",
            priority: "essential" as const,
          },
        ],
      },
    },
    additions: [],
  };
  const a = {
    ...website,
    goals:
      "I need a professional website and help setting up my business Instagram page.",
  };
  const result = solutions(a, state);
  expect(
    result
      .find((s) => s.id === "website")
      ?.requirements.some((r) => r.id === `requirement-user-${id}`),
  ).toBe(true);
  expect(
    result
      .find((s) => s.id === "instagram")
      ?.requirements.some((r) => r.id === `requirement-user-${id}`),
  ).toBe(false);
  expect(
    createReport(
      a,
      1,
      true,
      [],
      undefined,
      [],
      {},
      state,
    ).consulting?.requirements?.find((r) => r.id === `requirement-user-${id}`)
      ?.provenance[0].sourceKey,
  ).toBe("canvas");
});
it("retains revision identity across JSONB key ordering and exposes orphaned legacy selections", async () => {
  const { unresolvedSelections } = await import(
    "../../shared/src/solutions.js"
  );
  const first = {
    edits: {
      website: { title: "Business website", notes: "A scoped online home." },
      booking: { notes: "Allow appointment requests." },
    },
    additions: [],
  };
  const second = {
    ...first,
    edits: { booking: first.edits.booking, website: first.edits.website },
  };
  expect(solutions(website, first)[0].revision).toBe(
    solutions(website, second)[0].revision,
  );
  expect(
    unresolvedSelections(
      { edits: { legacy: { decision: "selected" } }, additions: [] },
      solutions(website),
    ),
  ).toEqual(["legacy"]);
});
it("keeps a separately requested website alongside an operational platform without copying dispatch capabilities into it", () => {
  const result = solutions({
    ...logisticsPersona,
    goals: `${logisticsPersona.goals} I also need a professional website where customers can learn about our services and contact us.`,
  });
  expect(result.map((s) => s.id)).toEqual(["integration", "website"]);
  expect(
    result
      .find((s) => s.id === "integration")
      ?.requirements.find((r) => r.id.includes("gps"))?.priority,
  ).toBe("deferred");
  const site = result.find((s) => s.id === "website")!;
  expect(site.requirements.some((r) => /assignment|gps|proof/.test(r.id))).toBe(
    false,
  );
  expect(site.requirements.map((r) => r.label)).toContain(
    "Service information",
  );
});

import { grooming } from "./grooming-fixture.js";
import { projectIntent } from "../../shared/src/project-intent.js";
import { planDiscovery } from "../src/discovery-planner.js";
import { localReply } from "../src/conversation-guidance.js";
it("recognises the exact prelaunch brief, exclusions and two complementary solutions", () => {
  expect(projectIntent(grooming.request)).toMatchObject({
    prelaunch: true,
    website: true,
    social: true,
    excludedApplication: true,
    deferredBooking: true,
  });
  const report = createReport(grooming, 1, true, []);
  expect(
    report.recommendations
      .filter((r) => !r.optional)
      .map((r) => r.serviceId)
      .sort(),
  ).toEqual(["instagram", "website"]);
  const site = solutions(grooming).find((s) => s.id === "website")!;
  expect(site.requirements.map((r) => r.label)).toEqual(
    expect.arrayContaining([
      "Service information",
      "Prices",
      "Service coverage areas",
      "WhatsApp or contact-form enquiries",
      "Easy content maintenance",
    ]),
  );
  expect(
    site.requirements.find((r) => r.id === "requirement-booking")?.priority,
  ).toBe("deferred");
  expect(
    report.sections
      .find((s) => s.title === "Practical roadmap")
      ?.paragraphs.join(" "),
  ).toContain("branding");
  expect(JSON.stringify(report.sections)).not.toMatch(
    /Native mobile|Record the present steps/,
  );
  expect(report.consulting?.summary).toContain("complementary");
});
it("selects missing launch questions and preserves skips as interactions without facts", () => {
  expect(planDiscovery(grooming).question?.id).toBe("branding");
  const a = { ...grooming, branding: "", launchContent: "" };
  const plan = planDiscovery(a, 2, [], [], {
    branding: "skipped",
    launchContent: "skipped",
  });
  expect(plan.question?.id).toBe("socialAccount");
  expect(plan.answered).toBe(2);
  expect(
    createReport(a, 2, true, [], undefined, [], {
      branding: "skipped",
    }).consulting?.facts.some((f) => f.sourceKey === "branding"),
  ).toBe(false);
  expect(
    plan.ranking.some((r) =>
      ["dataCaptureDetails", "reportingDetails", "workflowDetails"].includes(
        r.id,
      ),
    ),
  ).toBe(false);
});
it("reconciles a legacy application identity and keeps historical reasoning immutable", () => {
  const old = createReport(
    {
      stage: "specific",
      request:
        "I need a custom web application for customers to create and manage records.",
    },
    1,
    true,
    [],
  );
  const before = JSON.stringify(old);
  const state = emptyCanvasState();
  state.edits.webapp = {
    title: "Build a business website",
    notes: grooming.request,
    capabilities: [
      {
        id: "whatsapp",
        label: "WhatsApp enquiry button",
        priority: "essential",
      },
    ],
  };
  const site = projectSolutions(old, state, 2).find((s) => s.id === "webapp")!;
  expect(site.category).toBe("website");
  expect(site.refined).toBe(true);
  expect(site.requirements.map((r) => r.label)).toContain("Prices");
  expect(site.why).not.toContain("intended functionality for an application");
  expect(site.why).toContain("Refined by you");
  expect(site.alternatives.join(" ")).not.toContain("Native mobile");
  expect(JSON.stringify(old)).toBe(before);
});
it("retrieves Canvas-only capabilities in local Chat and respects removal and deferral", () => {
  const state = emptyCanvasState();
  const guide = "Downloadable grooming preparation guide";
  state.edits.website = {
    capabilities: [{ id: "guide", label: guide, priority: "essential" }],
  };
  const answer = () =>
    localReply(
      grooming,
      "What new feature did I add to this solution?",
      [],
      "conversation",
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      solutions(grooming, state),
    );
  expect(answer()).toContain(`${guide}: essential`);
  state.edits.website.capabilities![0].priority = "deferred";
  expect(answer()).toContain(`${guide}: deferred`);
  state.edits.website.capabilities = [];
  expect(answer()).not.toContain(guide);
  expect(JSON.stringify(solutions(website))).not.toContain(guide);
});
it("keeps a legacy corrected record identity after reclassification without duplicating the website", () => {
  const state = emptyCanvasState();
  state.edits.webapp = {
    title: "Build a business website",
    notes:
      "A simple website for services, prices and WhatsApp enquiries. Online booking can wait.",
  };
  const result = solutions(grooming, state);
  expect(result.filter((s) => s.visual === "website")).toHaveLength(1);
  expect(
    result.find((s) => s.id === "webapp")?.requirements.map((r) => r.label),
  ).toContain("Prices");
});

it("uses the focused current solution when multiple solutions have user refinements", () => {
  const state = emptyCanvasState();
  state.edits.instagram = { title: "My Instagram profile" };
  state.edits.website = {
    capabilities: [
      {
        id: crypto.randomUUID(),
        label: "Downloadable guide",
        priority: "essential",
      },
    ],
  };
  const reply = localReply(
    grooming,
    "What new feature did I add?",
    [],
    "conversation",
    undefined,
    undefined,
    [],
    undefined,
    undefined,
    solutions(grooming, state),
    "website",
  );
  expect(reply).toContain("Downloadable guide: essential");
});
it("removes superseded application requirements from new assessments after a website correction", () => {
  const a = {
    stage: "specific",
    request:
      "I need a custom web application for users to create records. Essential first version: role-based permissions and CSV exports.",
  };
  const state = emptyCanvasState();
  state.edits.webapp = {
    title: "Build a business website",
    notes:
      "A simple website showing services and prices with WhatsApp enquiries. No custom application. Online booking can wait.",
  };
  const report = createReport(a, 2, true, [], undefined, [], {}, state);
  expect(report.consulting?.requirements?.map((r) => r.id)).not.toEqual(
    expect.arrayContaining(["requirement-permissions", "requirement-exports"]),
  );
  expect(report.consulting?.requirements?.map((r) => r.label)).toContain(
    "Prices",
  );
  expect(JSON.stringify(report.consulting?.directions[0].risks)).not.toContain(
    "Essential user roles",
  );
  expect(JSON.stringify(report.recommendations[0].dependencies)).not.toContain(
    "Essential user roles",
  );
});
