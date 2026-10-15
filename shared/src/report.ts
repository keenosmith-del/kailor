import type { Report } from "./index.js";

// Read-only presentation adapter. Historic snapshot JSON is never modified.
export function customerReport(report: Report): Report {
  if (report.presentationVersion === 2) return report;
  const clean = (text: string) =>
    text
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
    title:
      report.title === "Your way forward"
        ? "Business improvement assessment"
        : report.title,
    status: "Preliminary assessment · not human-reviewed",
    sections: report.sections
      .map((s) => ({
        title: s.title,
        paragraphs: s.paragraphs
          .filter(
            (p) =>
              !/^(?:Starting point:|Reference only|Evidence:|Readiness:|Confirmed correction:|Current booking provider:)/.test(
                p,
              ),
          )
          .map(clean),
      }))
      .filter((s) => s.paragraphs.length),
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
