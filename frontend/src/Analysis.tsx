import {
ArrowRight,
ChevronLeft,
ChevronRight,
Download,
RefreshCw,
} from "lucide-react";
import { AnimatePresence,motion } from "motion/react";
import { useEffect,useState } from "react";
import type { Report,Session } from "../../shared/src/index";
import { api,downloadReport } from "./api";
import { ErrorBox,errorMessage } from "./ui";
export function Analysis({
  session,
  assess,
  busy,
}: {
  session: Session;
  assess: () => Promise<void>;
  busy: boolean;
}) {
  const [report, setReport] = useState<{
      content: Report;
      stale: boolean;
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
        <p className="eyebrow">your way forward</p>
        <h1>
          A little clarity
          <br />
          goes a long way.
        </h1>
        <p className="lead">
          Prepare your assessment once your context, challenges and goals are
          confirmed.
        </p>
        <ErrorBox error={error} />
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
      {report.stale && (
        <div className="notice">
          Your discovery has changed since this snapshot.
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
            transition={{ duration: 0.2 }}
          >
            <p className="eyebrow">0{index + 1} / your analysis</p>
            <h1>{section.title}</h1>
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
              {i + 1}
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
