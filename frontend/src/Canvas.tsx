import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Session } from "../../shared/src/index";
import { Link } from "react-router";
import type { Next } from "./types";
import { api, sessionHref } from "./api";
import { ErrorBox, errorMessage } from "./ui";
type CanvasData = {
  existing: string[];
  existingOrigin?: string;
  components: {
    id: string;
    title: string;
    kind: string;
    complexity: string;
    dependencies: string[];
    evidence: string[];
  }[];
  note: string;
};
export function Canvas({
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
  const [canvas, setCanvas] = useState<CanvasData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    setCanvas(null);
    void api<CanvasData>(`/sessions/${session.id}/canvas`)
      .then(setCanvas)
      .catch((e) => setError(errorMessage(e)));
  }, [session.id, session.revision]);
  return (
    <section className="canvas">
      <h1>
        Connecting
        <br />
        the possibilities.
      </h1>
      <p className="lead">
        A considered system, built around what you already have.
      </p>
      <ErrorBox error={error} />
      {canvas && (
        <>
          <div className="canvas-existing">
            <p className="eyebrow">your starting point</p>
            {canvas.existingOrigin === "described" && (
              <p className="muted">
                Channels described in your answers; interpretation remains open
                to review.
              </p>
            )}
            {canvas.existing
              .filter((x) => x !== "none")
              .map((x) => (
                <span className="pill" key={x}>
                  {x}
                </span>
              ))}
            {!canvas.existing.some((x) => x !== "none") && (
              <p className="muted">No existing online presence confirmed.</p>
            )}
          </div>
          <div className="canvas-grid">
            {canvas.components.map((c, i) => (
              <motion.article
                className={`component-card ${c.kind}`}
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <span className="badge">
                  {c.kind === "future" ? "future proposal" : c.kind}
                </span>
                <h2>{c.title}</h2>
                <p className="muted">{c.complexity}</p>
                <details>
                  <summary>Evidence & dependencies</summary>
                  {c.evidence.map((e) => (
                    <p key={e}>{e}</p>
                  ))}
                  <ul>
                    {c.dependencies.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </details>
              </motion.article>
            ))}
          </div>
          {!canvas.components.length && (
            <div className="quiet-card">
              Continue discovery to identify components supported by your
              answers.
            </div>
          )}
          <p className="fine-print">{canvas.note}</p>
        </>
      )}
      {next.readiness.canAssess ? (
        <button
          className="button primary"
          disabled={busy}
          onClick={() => void assess()}
        >
          Prepare analysis <ArrowRight size={17} />
        </button>
      ) : (
        <p className="lead">
          {next.readiness.reasons.join(". ")}{" "}
          <Link className="text-link" to={sessionHref(session.id, "discovery")}>
            Return to discovery
          </Link>
        </p>
      )}
    </section>
  );
}
