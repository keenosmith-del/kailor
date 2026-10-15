import { useId } from "react";
import type { Report } from "../../../../shared/src/index";
import { customerReport } from "../../../../shared/src/report";
import "./ReportReader.css";
export function ReportReader({ report }: { report: Report }) {
  const content = customerReport(report);
  const readerId = useId();
  const prefix = `${readerId}-report-${report.revision}-${report.createdAt.replace(/\W/g, "")}`;
  return (
    <article className="report-reader">
      <header>
        <p className="eyebrow">
          {content.assessmentType === "exploration"
            ? "Opportunity exploration"
            : "Initial assessment"}{" "}
          · {new Date(content.createdAt).toLocaleDateString()}
        </p>
        <h1>{content.title}</h1>
        <p className="report-status">
          {content.status}
          {content.synthetic ? " · Synthetic test" : ""}
        </p>
      </header>
      <nav aria-label="Report sections">
        {content.sections.map((s, i) => (
          <a key={i} href={`#${prefix}-${i}`}>
            {s.title}
          </a>
        ))}
      </nav>
      {content.sections.map((s, i) =>
        s.title === "Supporting evidence" ? (
          <details key={i} id={`${prefix}-${i}`}>
            <summary>{s.title}</summary>
            {s.paragraphs.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </details>
        ) : (
          <section key={i} id={`${prefix}-${i}`}>
            <h2>{s.title}</h2>
            {s.paragraphs.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </section>
        ),
      )}
    </article>
  );
}
