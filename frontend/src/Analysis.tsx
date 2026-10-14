import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Report, Session } from "../../shared/src/index";
import { Link } from "react-router";
import type { Next } from "./types";
import { api, downloadReport, sessionHref } from "./api";
import { ErrorBox, errorMessage } from "./ui";
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
  const reduced = useReducedMotion();
  const [report, setReport] = useState<{
      content: Report;
      stale: boolean;
      assessmentBlocked?: boolean;
    } | null>(null),
    [index, setIndex] = useState(0),
    [error, setError] = useState(""),
    [touch, setTouch] = useState<number | null>(null);
  useEffect(() => {
    setError("");
    void api<{ content: Report; stale: boolean }>(
      `/sessions/${session.id}/report`,
    )
      .then(setReport)
      .catch((e) => setError(errorMessage(e)));
  }, [session.id, session.revision]);
  function move(delta: number) {
    setIndex((i) => Math.max(0, Math.min(6, i + delta)));
  }
  if (!report)
    return (
      <section className="report-empty">
        <h1>
          A little clarity
          <br />
          goes a long way.
        </h1>
        <p className="lead">
          {next.readiness.canAssess
            ? "There is enough evidence for a qualified preliminary assessment."
            : next.readiness.reasons.join(". ")}
        </p>
        <ErrorBox error={error} />
        {next.readiness.canAssess ? (
          <button
            className="button primary"
            disabled={busy}
            onClick={() =>
              void assess()
                .then(() =>
                  api<{ content: Report; stale: boolean }>(
                    `/sessions/${session.id}/report`,
                  ).then(setReport),
                )
                .catch((e) => setError(errorMessage(e)))
            }
          >
            Prepare draft analysis <ArrowRight size={17} />
          </button>
        ) : (
          <Link className="text-link" to={sessionHref(session.id, "discovery")}>
            Return to discovery
          </Link>
        )}
      </section>
    );
  const section = report.content.sections[index];
  return (
    <section className="report">
      <div className="report-toolbar">
        <span className="badge">
          draft · consultant review{session.synthetic ? " · synthetic" : ""}
        </span>
        <button
          className="text-link"
          onClick={() =>
            void downloadReport(session.id).catch((e) =>
              setError(errorMessage(e)),
            )
          }
        >
          <Download size={16} /> Download PDF
        </button>
      </div>
      <ErrorBox error={error} />
      {report.assessmentBlocked && !report.stale && (
        <p className="notice">
          This snapshot reflects your confirmed information. Resolve the current
          clarification before preparing another assessment.{" "}
          <Link
            className="text-link"
            to={sessionHref(session.id, "conversation")}
          >
            Review the clarification
          </Link>
        </p>
      )}
      {report.stale && (
        <div className="notice">
          Your discovery has changed since this snapshot.
          {next.readiness.canAssess ? (
            <button
              className="text-link"
              disabled={busy}
              onClick={() =>
                void assess()
                  .then(() =>
                    api<typeof report>(`/sessions/${session.id}/report`).then(
                      setReport,
                    ),
                  )
                  .catch((e) => setError(errorMessage(e)))
              }
            >
              <RefreshCw size={15} /> Update analysis
            </button>
          ) : (
            <p>
              {next.readiness.reasons.join(". ")}{" "}
              <Link
                className="text-link"
                to={sessionHref(session.id, "discovery")}
              >
                Clarify your current situation
              </Link>
            </p>
          )}
        </div>
      )}
      <div
        className="report-panel"
        tabIndex={0}
        aria-label="Analysis panels. Use left and right arrow keys."
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowRight") move(1);
          if (e.key === "ArrowLeft") move(-1);
        }}
        onTouchStart={(e) => setTouch(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch !== null) {
            const delta = touch - e.changedTouches[0].clientX;
            if (Math.abs(delta) > 60) move(delta > 0 ? 1 : -1);
            setTouch(null);
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <h1>{section.title[0] + section.title.slice(1).toLowerCase()}</h1>
            <div className="report-content">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="report-controls">
        <button
          className="icon-button"
          aria-label="Previous section"
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          <ChevronLeft />
        </button>
        <div className="report-dots">
          {report.content.sections.map((s, i) => (
            <button
              aria-label={s.title}
              aria-current={index === i ? "step" : undefined}
              key={s.title}
              onClick={() => setIndex(i)}
            >
              {s.title[0] + s.title.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          className="icon-button"
          aria-label="Next section"
          disabled={index === 6}
          onClick={() => move(1)}
        >
          <ChevronRight />
        </button>
      </div>
      <p className="fine-print">
        Snapshot revision {report.content.revision} ·{" "}
        {report.content.createdAt.slice(0, 10)} · Swipe or use arrow keys while
        the panel is focused.
      </p>
    </section>
  );
}
