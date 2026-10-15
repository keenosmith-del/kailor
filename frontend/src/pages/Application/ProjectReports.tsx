import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Download, FileText } from "lucide-react";
import type { Report, Session } from "../../../../shared/src/index";
import { api, downloadReport, sessionHref } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";
type Snapshot = {
  id: string;
  createdAt: string;
  assessment: { sessionId: string; summary: string; knowledgeRevision: number };
};
export function ProjectReports({
  session,
  sources = false,
  refreshVersion = 0,
}: {
  session: Session;
  sources?: boolean;
  refreshVersion?: number;
}) {
  const [rows, setRows] = useState<Snapshot[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [historic, setHistoric] = useState<Report | null>(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load(cursor?: string) {
    const result = await api<{
      reports: Snapshot[];
      nextCursor: string | null;
    }>(`/plans/${session.planId}/reports${cursor ? `?cursor=${cursor}` : ""}`);
    setRows((old) => (cursor ? [...old, ...result.reports] : result.reports));
    setCursor(result.nextCursor);
  }
  useEffect(() => {
    setRows([]);
    setHistoric(null);
    setSelected("");
    setError("");
    void load().catch((e) => setError(errorMessage(e)));
  }, [session.planId, session.revision, refreshVersion]);
  async function open(id: string) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ content: Report }>(
        `/plans/${session.planId}/reports/${id}`,
      );
      setSelected(id);
      setHistoric(result.content);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={`project-reports ${sources ? "application-sources" : ""}`}
    >
      <h1>{sources ? "Sources" : "Analysis history"}</h1>
      <p className="lead">
        {sources
          ? "Saved material from this project, ready to revisit and discuss."
          : "Earlier assessments stay saved when your understanding develops."}
      </p>
      <ErrorBox error={error} />
      {!rows.length && (
        <p className="muted">
          No saved analyses yet. Add context in Chat or Discovery, then prepare
          an analysis when you're ready.
        </p>
      )}
      {sources && (
        <p className="source-capabilities">
          Generated analyses and PDF reports are available here. Document
          uploads and PDF/CSV ingestion are not yet supported.
        </p>
      )}
      <div className="source-list">
        {rows.map((row) => (
          <article className="source-row" key={row.id}>
            <FileText size={19} />
            <div>
              <button
                className="text-link"
                disabled={busy}
                aria-expanded={selected === row.id}
                onClick={() => void open(row.id)}
              >
                Analysis · {new Date(row.createdAt).toLocaleString()}
              </button>
              <p>{row.assessment.summary}</p>
            </div>
            <button
              className="application-icon"
              aria-label={`Download analysis from ${new Date(row.createdAt).toLocaleString()}`}
              onClick={() =>
                void downloadReport(session.planId ?? "", row.id).catch((e) =>
                  setError(errorMessage(e)),
                )
              }
            >
              <Download size={17} />
            </button>
          </article>
        ))}
      </div>
      {cursor && (
        <button
          className="button"
          disabled={busy}
          onClick={() =>
            void load(cursor).catch((e) => setError(errorMessage(e)))
          }
        >
          More saved analyses
        </button>
      )}
      {historic && (
        <section className="historic-report" aria-label="Historical analysis">
          <div className="actions">
            <span className="badge">
              Saved snapshot · {historic.createdAt.slice(0, 10)}
            </span>
            <button
              className="text-link"
              onClick={() => {
                setHistoric(null);
                setSelected("");
              }}
            >
              Close snapshot
            </button>
            <button
              className="text-link"
              onClick={() =>
                void downloadReport(session.planId ?? "", selected).catch((e) =>
                  setError(errorMessage(e)),
                )
              }
            >
              <Download size={15} />
              Download PDF
            </button>
          </div>
          <h2>{historic.title}</h2>
          {historic.sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
          <Link className="button" to={sessionHref(session.id, "chat")}>
            Discuss in Chat
          </Link>
        </section>
      )}
    </section>
  );
}
