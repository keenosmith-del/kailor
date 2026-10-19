import { decisionLabel } from "../../../../shared/src/report";
import { useId, useState } from "react";
import { Link } from "react-router";
import type { Report } from "../../../../shared/src/index";
import "./ConsultingReport.css";
export function ConsultingReport({
  report,
  discussHref,
}: {
  report: Report;
  discussHref?: (id: string) => string;
}) {
  const brief = report.consulting!,
    prefix = useId();
  const [selected, setSelected] = useState(
    brief.directions.find((d) => d.status === "selected")?.id ??
      brief.directions[0]?.id ??
      "",
  );
  const [compare, setCompare] = useState(false);
  const direction = brief.directions.find((d) => d.id === selected);
  const wording =
    report.assessmentType === "solution"
      ? {
          starting: "Requirements and context",
          directions: "Proposed solution components",
          experiment:
            brief.relationship === "complementary"
              ? "Practical launch steps"
              : "A first feasibility check",
        }
      : report.assessmentType === "business"
        ? {
            starting: "Your current setup",
            directions: "Changes worth considering",
            experiment: "A first workflow trial",
          }
        : report.assessmentType === "idea"
          ? {
              starting: "Your idea and context",
              directions: "Directions to validate",
              experiment: "A first validation test",
            }
          : {
              starting: "Your starting point",
              directions: "Directions worth exploring",
              experiment: "A first practical experiment",
            };
  const sections = [
    ["starting", wording.starting],
    ["directions", wording.directions],
    ["experiment", wording.experiment],
    ["questions", "Remaining decisions"],
  ];
  return (
    <article className="report-reader consulting-report">
      <header>
        <p className="eyebrow">
          {report.assessmentType === "exploration"
            ? "Opportunity exploration"
            : report.assessmentType === "solution"
              ? "Solution assessment"
              : "Project assessment"}{" "}
          · {new Date(report.createdAt).toLocaleDateString()}
        </p>
        <h1>{report.title}</h1>
        <p className="report-status">{report.status}</p>
        <p className="consulting-summary">{brief.summary}</p>
      </header>
      <nav aria-label="Report sections">
        {sections.map(([key, label]) => (
          <a key={key} href={`#${prefix}-${key}`}>
            {label}
          </a>
        ))}
      </nav>
      <section id={`${prefix}-starting`}>
        <h2>{wording.starting}</h2>
        {brief.insights ? (
          <div className="consulting-facts">
            {brief.insights.map((insight) => (
              <div key={insight.title}>
                <h3>{insight.title}</h3>
                <p>{insight.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <dl className="consulting-facts">
            {brief.facts.map((f) => (
              <div key={f.id}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {!!brief.requirements?.length && (
          <div
            className="requirement-overview"
            aria-label="Requirement priorities"
          >
            {(
              [
                ["essential", "Essential"],
                ["optional", "Optional"],
                ["deferred", "Deferred"],
                ["unconfirmed", "Unknown"],
              ] as const
            ).map(([priority, label]) => (
              <section key={priority}>
                <h3>{label}</h3>
                <ul>
                  {brief
                    .requirements!.filter((r) => r.priority === priority)
                    .map((r) => (
                      <li key={r.id}>
                        {r.label}
                        {r.conflict ? ` — ${r.conflict}` : ""}
                      </li>
                    ))}
                </ul>
                {!brief.requirements!.some((r) => r.priority === priority) && (
                  <p>No confirmed items</p>
                )}
              </section>
            ))}
          </div>
        )}
        {!brief.facts.length && (
          <p>
            Your preferences remain open. There is no need to invent a business
            or skill.
          </p>
        )}
        <details
          open={
            brief.decisions.some(
              (d) =>
                d.title === "communicationStyle" &&
                d.notes === "technical-detail",
            ) || undefined
          }
        >
          <summary>Evidence and interpretation</summary>
          <h3>You reported</h3>
          {brief.facts.map((f) => (
            <p key={f.id}>{f.quote}</p>
          ))}
          <h3>What follows from that</h3>
          {brief.conclusions.map((s) => (
            <p key={s}>{s}</p>
          ))}
          <h3>Still a hypothesis</h3>
          {brief.hypotheses.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </details>
      </section>
      <section id={`${prefix}-directions`}>
        <div className="consulting-section-heading">
          <h2>{wording.directions}</h2>
          {brief.directions.length > 1 &&
            brief.relationship !== "complementary" && (
              <button
                className="text-link"
                aria-expanded={compare}
                onClick={() => setCompare((v) => !v)}
              >
                {compare ? "Close comparison" : "Compare possibilities"}
              </button>
            )}
        </div>
        <div className="direction-workspace">
          <div
            className="direction-list"
            role="group"
            aria-label="Assessment directions"
          >
            {brief.directions.map((d) => (
              <button
                key={d.id}
                className="direction-option"
                aria-pressed={selected === d.id}
                onClick={() => setSelected(d.id)}
              >
                <span>{d.title}</span>
                <small>
                  {d.status === "hypothesis"
                    ? "Possibility to validate"
                    : decisionLabel(d.status)}
                </small>
                <p>{d.summary}</p>
              </button>
            ))}
          </div>
          {direction && (
            <div className="direction-detail" aria-live="polite">
              <h3>{direction.title}</h3>
              <p>{direction.why}</p>
              <h4>What you would need</h4>
              <ul>
                {direction.requirements.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <h4>What remains uncertain</h4>
              <ul>
                {direction.risks.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p>{direction.costToTest}</p>
              <details>
                <summary>Why this direction appears</summary>
                {direction.basis
                  .slice(0, 3)
                  .map((id) => brief.facts.find((f) => f.id === id))
                  .filter(Boolean)
                  .map((f) => (
                    <p key={f!.id}>{f!.value}</p>
                  ))}
              </details>
              {discussHref && (
                <Link className="button" to={discussHref(direction.id)}>
                  Explore this direction in Chat
                </Link>
              )}
            </div>
          )}
        </div>
        {brief.approaches && (
          <div className="consulting-comparison">
            <table>
              <caption>Approaches to compare</caption>
              <thead>
                <tr>
                  <th>Approach</th>
                  <th>Strengths</th>
                  <th>Trade-offs</th>
                  <th>Appropriate when</th>
                </tr>
              </thead>
              <tbody>
                {brief.approaches.map((p) => (
                  <tr key={p.title}>
                    <th>{p.title}</th>
                    <td>{p.strengths}</td>
                    <td>{p.tradeoffs}</td>
                    <td>{p.appropriateWhen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {compare && (
          <div className="consulting-comparison">
            <table>
              <caption>
                Qualitative comparison — no measured scores or verified demand
              </caption>
              <thead>
                <tr>
                  <th>Direction</th>
                  <th>Commitment</th>
                  <th>Time</th>
                  <th>Next test</th>
                </tr>
              </thead>
              <tbody>
                {brief.directions.map((d) => (
                  <tr key={d.id}>
                    <th>{d.title}</th>
                    <td>{d.commitment}</td>
                    <td>{d.timeDemand}</td>
                    <td>{d.firstStep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section id={`${prefix}-experiment`}>
        <h2>{wording.experiment}</h2>
        {direction ? (
          <>
            <p>{direction.firstStep}</p>
            <ol className="experiment-steps">
              {direction.validation.map((step, i) => (
                <li key={step.kind}>
                  <span aria-hidden="true">{i + 1}</span>
                  <div>
                    <h3>{step.kind}</h3>
                    <p>{step.action}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="experiment-signals">
              <div>
                <h3>Continue when</h3>
                <p>{direction.continueWhen}</p>
              </div>
              <div>
                <h3>Stop or change when</h3>
                <p>{direction.stopWhen}</p>
              </div>
            </div>
          </>
        ) : (
          <p>Clarify one useful outcome before choosing a trial.</p>
        )}
      </section>
      <section id={`${prefix}-questions`}>
        <h2>Remaining decisions</h2>
        <ul>
          {brief.unknowns.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {brief.decisions.length > 0 && (
          <>
            <h3>Recorded decisions and preferences</h3>
            {brief.decisions.map((d, i) => (
              <p key={i}>
                <strong>{d.title}</strong> · {decisionLabel(d.status)}
                {d.notes ? ` — ${d.notes}` : ""}
              </p>
            ))}
          </>
        )}
        {discussHref && (
          <Link className="button" to={discussHref(direction?.id ?? "")}>
            Discuss your assessment in Chat
          </Link>
        )}
      </section>
      <details>
        <summary>Full written assessment</summary>
        {report.sections
          .filter((s) => s.title.trim() && s.paragraphs.some((p) => p.trim()))
          .map((s, i) => (
            <div className="written-section" key={i}>
              <h3>{s.title}</h3>
              {s.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          ))}
      </details>
    </article>
  );
}
