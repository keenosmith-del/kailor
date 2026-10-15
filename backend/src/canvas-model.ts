import { displayEvidence } from "../../shared/src/report.js";
import type { Answers, Report } from "../../shared/src/index.js";
import { opportunityDirections, isExploration } from "./exploration.js";
export type CanvasNode = {
  id: string;
  title: string;
  status: "reported" | "proposed" | "exploratory";
  purpose: string;
  evidence: string[];
  dependencies: string[];
  alternatives: string[];
};
export function canvasGraph(a: Answers, report: Report) {
  const nodes: CanvasNode[] = [];
  const edges: { from: string; to: string; label: string }[] = [];
  const add = (node: CanvasNode) => {
    nodes.push(node);
    return node.id;
  };
  const connect = (from: string, to: string, label: string) =>
    edges.push({ from, to, label });
  const node = (
    id: string,
    title: string,
    purpose: string,
    status: CanvasNode["status"] = "proposed",
    evidence: string[] = [],
    dependencies: string[] = [],
    alternatives: string[] = [],
  ) =>
    add({ id, title, purpose, status, evidence, dependencies, alternatives });
  if (isExploration(a)) {
    node(
      "start",
      "Your starting point",
      "No business idea is required. Preferences can remain open.",
      "reported",
    );
    for (const key of ["interests", "strengths", "explorationTime"])
      if (a[key]) {
        node(
          key,
          {
            interests: "Interests",
            strengths: "Experience and strengths",
            explorationTime: "Time and resources",
          }[key]!,
          String(a[key]),
          "reported",
          [String(a[key])],
        );
        connect("start", key, "you described");
      }
    for (const direction of opportunityDirections(a)) {
      node(
        direction.id,
        direction.title,
        direction.description,
        "exploratory",
        [],
        ["Check interest and fit; demand is unverified"],
        ["Choose another direction or keep exploring"],
      );
      connect("start", direction.id, "possibility to test");
    }
    node(
      "decision",
      "Choose a small experiment",
      "Discuss one direction and define what you want to learn. No purchase is required.",
      "exploratory",
    );
    for (const d of opportunityDirections(a))
      connect(d.id, "decision", "explore");
  } else if (a.stage === "starting") {
    node(
      "concept",
      "Your idea",
      String(a.idea ?? "The concept is still open."),
      "reported",
      a.idea ? [String(a.idea)] : [],
    );
    node(
      "people",
      "Who experiences the problem?",
      "Speak to a possible user about their current experience. Do not assume interest or demand.",
      "exploratory",
      [],
      ["Confirm the intended audience and whether the problem matters"],
    );
    node(
      "alternatives",
      "What do they use today?",
      "Compare current alternatives before specifying a product or buying tools.",
      "exploratory",
    );
    node(
      "trial",
      "A first validation step",
      "Try a sketch, conversation or manual demonstration. Record what you learn before committing to implementation.",
      "exploratory",
    );
    connect("concept", "people", "audience to validate");
    connect("people", "alternatives", "understand the current experience");
    connect("alternatives", "trial", "test an assumption");
  } else {
    const text = String(a.tools ?? "");
    const reported = [
      ...new Set([
        ...(Array.isArray(a.presence)
          ? a.presence
              .filter((x) => x !== "none")
              .map((x) => (x === "instagram" ? "Instagram" : x))
          : []),
        ...[
          "WhatsApp Business",
          "WhatsApp",
          "Instagram",
          "Google Calendar",
          "phone calendar",
          "Excel",
          "spreadsheet",
        ].filter((tool) => new RegExp(tool, "i").test(text)),
      ]),
    ].filter((x) => x !== "WhatsApp" || !/WhatsApp Business/i.test(text));
    for (const [i, title] of reported.entries())
      node(
        `existing-${i}`,
        title,
        "An existing channel or tool you described. No external account inspection has occurred.",
        "reported",
        [text || title],
      );
    if (!reported.length)
      node(
        "context",
        "Current situation",
        String(
          a.industry ??
            a.idea ??
            a.request ??
            "Your current situation is still open.",
        ),
        "reported",
      );
    node(
      "outcome",
      "Desired improvement",
      String(
        a.goals ??
          report.recommendations[0]?.problem ??
          "Clarify the outcome to test.",
      ),
      "reported",
      a.goals ? [String(a.goals)] : [],
    );
    for (const n of nodes.filter(
      (x) => x.id.startsWith("existing") || x.id === "context",
    ))
      connect(n.id, "outcome", "current workflow");
    for (const r of report.recommendations) {
      node(
        r.serviceId,
        r.solution,
        r.problem,
        "proposed",
        r.evidence.map(displayEvidence),
        r.dependencies.filter((x) => !x.startsWith("Reference ")),
        r.alternatives.filter((x) => !x.startsWith("Reference ")),
      );
      connect("outcome", r.serviceId, "could address");
      if (r.serviceId === "booking") {
        node(
          "availability",
          "Availability and appointments",
          "Customers could request or confirm a time through a hosted booking page.",
          "proposed",
          [],
          ["Check appointment types, mobile usability and approval settings"],
        );
        node(
          "reminders",
          "Reminders and confirmations",
          "Reduce manual follow-up if the selected service supports suitable reminder channels.",
          "proposed",
          [],
          [
            "Verify message fees, consent and supported channels; WhatsApp automation is unverified",
          ],
        );
        node(
          "calendar",
          "Calendar connection",
          "Check whether the service supports the calendar you use, including sync direction and conflict handling.",
          "proposed",
          [],
          ["Integration and calendar compatibility are not verified"],
        );
        connect(r.serviceId, "availability", "provider capability to check");
        connect("availability", "reminders", "optional capability");
        connect("reminders", "calendar", "compatibility to verify");
      }
    }
    node(
      "trial",
      "Next decision",
      "Compare an existing tool or a manual improvement, then try the smallest useful change.",
      "exploratory",
    );
    for (const r of report.recommendations)
      connect(r.serviceId, "trial", "compare and test");
    if (!report.recommendations.length) connect("outcome", "trial", "clarify");
  }
  return { nodes, edges };
}
