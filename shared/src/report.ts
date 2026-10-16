import type { Report } from "./index.js";

// Read-only presentation adapter. Historic snapshot JSON is never modified.
export function customerReport(report: Report): Report {
  const clean = (text: string) =>
    text
      .replace(
        /Consultant hours must be configured in data\/services\.ts\.?/gi,
        "",
      )
      .replace(/manual_review/g, "Scope and quotation required")
      .replace(/indicative_draft/g, "Indicative estimate")
      .replace(/vendor_quote_required/g, "Check the selected service and plan")
      .replace(
        /qualified preliminary assessment available/g,
        "An initial assessment is available",
      )
      .replace(/Described in a confirmed answer: /g, "")
      .replace(
        /User-selected challenges:.*$/g,
        "Challenges are reflected in the recommended direction.",
      )
      .replace(
        /\b(?:bookingDetails|workflowDetails|scopeDetails|invoiceDetails|contentDetails|industry|goals|constraints|tools|presence|request):\s*/g,
        "",
      )
      .replace(/\bnot provided\b/g, "not yet confirmed");
  return {
    ...report,
    recommendations: report.recommendations.map((r) => ({
      ...r,
      estimate: { ...r.estimate, notes: clean(r.estimate.notes) },
    })),
    consulting: report.consulting
      ? {
          ...report.consulting,
          directions: report.consulting.directions.map((d) => ({
            ...d,
            costToTest: clean(d.costToTest),
          })),
        }
      : undefined,
    title:
      report.title === "Your way forward"
        ? "Business improvement assessment"
        : report.title,
    status: "Preliminary assessment · not human-reviewed",
    sections: report.sections
      .map((s) => ({
        title: clean(s.title)
          .replace(/^#+\s*/, "")
          .trim(),
        paragraphs: s.paragraphs
          .filter(
            (p) =>
              !/^(?:Starting point:|Reference only|Evidence:|Readiness:|Confirmed correction:|Current booking provider:)/.test(
                p,
              ),
          )
          .map(clean)
          .filter((p) => p.trim() && !/^#+\s*$/.test(p)),
      }))
      .filter((s) => s.title && s.paragraphs.length),
  };
}
export const reportSummary = (report: Report) => {
  const r = customerReport(report);
  return r.recommendations.length
    ? r.recommendations
        .slice(0, 2)
        .map((x) => x.solution)
        .join("; ")
    : (r.sections[0]?.paragraphs[0]?.slice(0, 240) ??
        "An initial exploration of your next steps.");
};

export function displayEvidence(value: string) {
  const labels: Record<string, string> = {
    credibility: "Presenting work professionally",
    booking: "Managing appointments",
    invoices: "Invoice administration",
    content: "Recurring content or research",
    outdated: "An outdated website",
    custom: "A specific application requirement",
    none: "Still exploring",
  };
  return value
    .replace(/^problems: (.+)$/, (_, choices: string) =>
      choices
        .split(", ")
        .map((c) => labels[c] ?? c)
        .join("; "),
    )
    .replace(/^\w+: /, "");
}

export const decisionLabel = (status: string) =>
  (
    ({
      hypothesis: "Proposed",
      selected: "Selected for exploration",
      developing: "Being developed",
      rejected: "Set aside",
      deferred: "Deferred",
      exploring: "Reconsidering",
    }) as Record<string, string>
  )[status] ?? status;
