import "./Analysis.css";
import { Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { Report, Session } from "../../../../shared/src/index";
import { Link } from "react-router";
import type { Next } from "../../types/session";
import { api, ApiError, downloadReport, sessionHref } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";
import { ReportReader } from "../../components/ReportReader/ReportReader";
export function Analysis({
  session,
  assess,
  busy,
  next,
}: {
  session: Session;
  assess: () => Promise<void>;
  busy: boolean;
  next: Next;
}) {
  const [report, setReport] = useState<{
    content: Report;
    stale: boolean;
    reportId: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let current = true;
    setReport(null);
    setLoading(true);
    setError("");
    void api<NonNullable<typeof report>>(`/sessions/${session.id}/report`)
      .then((r) => {
        if (current) setReport(r);
      })
      .catch((e) => {
        if (current && !(e instanceof ApiError && e.code === "report_missing"))
          setError(errorMessage(e));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [session.id, session.revision]);
  async function prepare() {
    try {
      await assess();
      setReport(await api(`/sessions/${session.id}/report`));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  if (loading && !report)
    return (
      <p className="loading" role="status">
        Opening your saved assessment…
      </p>
    );
  return (
    <section className="report">
      <ErrorBox error={error} />
      {report ? (
        <>
          <div className="report-toolbar">
            <Link
              className="text-link"
              to={`${sessionHref(session.id, "chat")}?report=${report.reportId}`}
            >
              Discuss this assessment
            </Link>
            <button
              className="text-link"
              onClick={() =>
                void downloadReport(
                  session.planId ?? session.id,
                  session.planId ? report.reportId : undefined,
                ).catch((e) => setError(errorMessage(e)))
              }
            >
              <Download size={16} /> Download PDF
            </button>
          </div>
          {report.stale && (
            <div className="notice">
              Your project has changed. This saved report remains unchanged.{" "}
              {next.readiness.canAssess && (
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => void prepare()}
                >
                  <RefreshCw size={14} /> Prepare a new version
                </button>
              )}
            </div>
          )}
          <ReportReader report={report.content} />
        </>
      ) : (
        <div className="report-empty">
          <h1>A useful next step.</h1>
          <p className="lead">{next.readiness.reasons.join(". ")}</p>
          {next.readiness.canAssess ? (
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void prepare()}
            >
              Prepare initial assessment
            </button>
          ) : (
            <Link
              className="text-link"
              to={sessionHref(session.id, "discovery")}
            >
              Explore in Discovery
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
