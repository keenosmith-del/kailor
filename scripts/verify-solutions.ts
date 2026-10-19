import type { Answers } from "../shared/src/index.js";
// Local visual-QA helper. Only modifies a newly created synthetic guest conversation.
import { db } from "../backend/src/db.js";
import { getSession, submitAnswer } from "../backend/src/session-service.js";
import { logisticsPersona } from "../backend/tests/operations-fixture.js";
const [id, mode = "website"] = process.argv.slice(2);
if (!id)
  throw Error(
    "Supply the ID of a disposable guest conversation opened for visual QA.",
  );
const target = await db.discoverySession.findUniqueOrThrow({
  where: { id },
  include: {
    admin: true,
    _count: { select: { answers: true, messages: true, assessments: true } },
  },
});
if (
  !target.admin.isGuest ||
  (!target.synthetic &&
    (target.title !== "New conversation" ||
      target._count.answers > 0 ||
      target._count.messages > 0 ||
      target._count.assessments > 0))
)
  throw Error("Only a new guest QA fixture can be changed.");
await db.discoverySession.update({
  where: { id },
  data: { synthetic: true, title: "Solution canvas visual QA" },
});
const choices: Record<string, Answers> = {
  website: {
    stage: "established",
    kind: "business",
    industry: "I run a small plumbing business.",
    goals:
      "I need a professional website where customers can learn about my services and contact me.",
  },
  two: {
    goals:
      "I need a professional website and help setting up my business Instagram page.",
  },
  three: {
    goals:
      "I need a professional website, help setting up my business Instagram page and an online booking system so customers can arrange appointments.",
  },
  logistics: { ...logisticsPersona, problems: ["custom"] },
};
let session = await getSession(id, target.adminId);
for (const [questionId, value] of Object.entries(
  choices[mode] ?? choices.three,
).sort(
  ([a], [b]) => Number(a === "scopeDetails") - Number(b === "scopeDetails"),
))
  session = await submitAnswer(id, target.adminId, {
    revision: session.revision,
    questionId,
    value,
  });
if (mode === "many") {
  const { saveCanvas } = await import("../backend/src/workspace-service.js");
  const { canvas } = await import("../backend/src/session-service.js");
  const current = await canvas(id, target.adminId);
  await saveCanvas(target.planId, target.adminId, current.projectRevision, {
    ...current.state,
    additions: [
      {
        id: crypto.randomUUID(),
        kind: "idea",
        title:
          "Customer mobile application for recurring service requests and shared property records",
        notes:
          "My proposal for customers who manage several properties; validate scope before commissioning.",
      },
      {
        id: crypto.randomUUID(),
        kind: "idea",
        title: "Automated appointment reminders",
        notes:
          "My proposal for reducing manual follow-ups; investigate channel consent and provider support.",
      },
    ],
  });
}
console.log(`Prepared ${mode} visual fixture ${id}`);
await db.$disconnect();
