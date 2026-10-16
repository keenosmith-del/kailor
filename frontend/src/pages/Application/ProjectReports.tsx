import { ProjectSources } from "./ProjectSources";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Download, FileText } from "lucide-react";
import type { Session } from "../../../../shared/src/index";
import { api, downloadReport, sessionHref } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";
type Snapshot = {
  id: string;
  title: string;
  summary: string;
  assessmentType: string;
  createdAt: string;
  status: string;
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
  const [params, setParams] = useSearchParams();
  const category = params.get("library") ?? "all";
  const [rows, setRows] = useState<Snapshot[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [error, setError] = useState("");
  async function load(cursor?: string) {
    const result = await api<{
      reports: Snapshot[];
      nextCursor: string | null;
    }>(`/plans/${session.planId}/reports${cursor ? `?cursor=${cursor}` : ""}`);
    setRows((old) => (cursor ? [...old, ...result.reports] : result.reports));
    setCursor(result.nextCursor);
  }
  useEffect(() => {
    let current = true;
    setRows([]);
    setError("");
    void api<{ reports: Snapshot[]; nextCursor: string | null }>(
      `/plans/${session.planId}/reports`,
    )
      .then((r) => {
        if (current) {
          setRows(r.reports);
          setCursor(r.nextCursor);
        }
      })
      .catch((e) => {
        if (current) setError(errorMessage(e));
      });
    return () => {
      current = false;
    };
  }, [session.planId, session.revision, refreshVersion]);
  useEffect(() => {
    const target = location.hash.startsWith("#assessment-")
      ? location.hash.slice(1)
      : null;
    if (!target) return;
    const row = document.getElementById(target);
    if (row) row.scrollIntoView?.({ block: "center" });
    else if (cursor) void load(cursor).catch((e) => setError(errorMessage(e)));
  }, [rows, cursor]);

  return (
    <section
      className={`project-reports ${sources ? "application-sources" : ""}`}
    >
      {sources ? (
        <>
          <h1>Sources</h1>
          <p className="source-capabilities">
            Your project library. Notes, references, documents and saved
            assessments stay together.
          </p>
          <nav className="library-filters" aria-label="Resource categories">
            {[
              ["all", "All resources"],
              ["documents", "Documents"],
              ["references", "References"],
              ["notes", "Project notes"],
              ["assessments", "Assessments"],
            ].map(([id, label]) => (
              <button
                key={id}
                className="text-link"
                aria-pressed={category === id}
                onClick={() => setParams({ library: id }, { replace: true })}
              >
                {label}
              </button>
            ))}
          </nav>
        </>
      ) : (
        <h2>Analysis history</h2>
      )}
      <ErrorBox error={error} />
      {sources && category !== "assessments" && (
        <ProjectSources session={session} filter={category} />
      )}
      {(!sources || ["all", "assessments"].includes(category)) && (
        <section id="assessments">
          {sources && <h2>Saved assessments</h2>}
          {!rows.length && (
            <p className="muted">
              No saved assessments yet. Prepare one when there is enough
              context.
            </p>
          )}
          <div className="source-list">
            {rows.map((row) => (
              <article
                className="source-row"
                key={row.id}
                id={`assessment-${row.id}`}
              >
                <FileText size={18} />
                <div>
                  <Link
                    className="text-link"
                    to={`${sessionHref(session.id, "analysis")}?report=${row.id}&from=${sources ? "sources" : "analysis"}&library=${encodeURIComponent(category)}`}
                  >
                    {row.title}
                  </Link>
                  <p>
                    {new Date(row.createdAt).toLocaleDateString()} ·{" "}
                    {row.assessmentType === "exploration"
                      ? "Opportunity exploration"
                      : "Project assessment"}
                  </p>
                  <p>{row.summary}</p>
                  <Link
                    className="text-link"
                    to={`${sessionHref(session.id, "chat")}?report=${row.id}`}
                  >
                    Discuss in Chat
                  </Link>
                </div>
                <button
                  className="application-icon"
                  aria-label={`Download analysis from ${new Date(row.createdAt).toLocaleString()}`}
                  onClick={() =>
                    void downloadReport(session.planId ?? "", row.id).catch(
                      (e) => setError(errorMessage(e)),
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
              onClick={() =>
                void load(cursor).catch((e) => setError(errorMessage(e)))
              }
            >
              More saved assessments
            </button>
          )}
        </section>
      )}
    </section>
  );
}
