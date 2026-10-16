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
  group?: "context" | "directions" | "next";
  sourceKey?: string;
  decision?: string;
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
  if (isExploration(a) && report.consulting) {
    const brief = report.consulting;
    const goal = brief.facts.find((f) => f.kind === "goal");
    node(
      "start",
      goal?.label ?? "Your starting point",
      goal?.value ?? brief.summary,
      "reported",
    );
    if (goal) nodes[0].sourceKey = goal.sourceKey;
    for (const fact of brief.facts) {
      if (fact.id === goal?.id) continue;
      node(
        fact.id,
        fact.value.length > 78 ? `${fact.value.slice(0, 75)}…` : fact.value,
        fact.value,
        "reported",
        fact.quote.length <= 150 ? [] : [fact.quote],
      );
      Object.assign(nodes.at(-1)!, {
        sourceKey: fact.sourceKey === "canvas" ? undefined : fact.sourceKey,
        group: "context",
      });
      connect("start", fact.id, "you described");
    }
    for (const direction of brief.directions) {
      node(
        direction.id,
        direction.title,
        direction.summary,
        "exploratory",
        direction.basis
          .map((id) => brief.facts.find((f) => f.id === id)?.value)
          .filter((v): v is string => !!v),
        direction.requirements,
        direction.risks,
      );
      Object.assign(nodes.at(-1)!, {
        group: "directions",
        decision: direction.status,
      });
      for (const fact of direction.basis)
        if (nodes.some((n) => n.id === fact))
          connect(fact, direction.id, "supports a small test");
      if (!direction.basis.length)
        connect("start", direction.id, "hypothesis to explore");
    }
    node(
      "decision",
      "Choose a first experiment",
      "Select one direction and decide what you want to learn before committing money.",
      "exploratory",
    );
    Object.assign(nodes.at(-1)!, { group: "next" });
    for (const d of brief.directions)
      connect(
        d.id,
        "decision",
        d.status === "rejected"
          ? "set aside"
          : d.status === "selected"
            ? "develop this direction"
            : "compare and test",
      );
  } else if (isExploration(a)) {
    node(
      "start",
      "Your starting point",
      "Preferences can remain open.",
      "reported",
    );
    for (const d of opportunityDirections(a)) {
      node(d.id, d.title, d.description, "exploratory");
      connect("start", d.id, "possibility to test");
    }
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
  for (const n of nodes) {
    if (n.id === "concept" && a.idea) n.sourceKey = "idea";
    if (n.id === "context")
      n.sourceKey = a.industry
        ? "industry"
        : a.idea
          ? "idea"
          : a.request
            ? "request"
            : undefined;
    if (n.id === "outcome" && a.goals) n.sourceKey = "goals";
    if (n.id.startsWith("existing-") && a.tools) n.sourceKey = "tools";
    n.evidence = [...new Set(n.evidence)].filter(
      (e) => e.trim() !== n.purpose.trim(),
    );
    n.group ??=
      n.status === "reported"
        ? "context"
        : /trial|decision/.test(n.id)
          ? "next"
          : "directions";
  }
  return { nodes, edges };
}
