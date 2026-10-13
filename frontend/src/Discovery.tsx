import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import type { AnswerValue } from "../../shared/src/index";
import { api, sessionHref } from "./api";
import { Mascot } from "./Mascot";
import { mascotAssets } from "./mascot-assets";
import type { Next, SessionProps } from "./types";
const discoveryPoses = ["attentive", "thinking", "curious"] as const;

function DiscoveryScene({
  busy,
  children,
}: {
  busy: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const present = useIsPresent();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);
  return (
    <motion.div
      className="discovery-layout"
      aria-hidden={!present}
      inert={!present || busy}
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8 }}
      transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Discovery({
  session,
  next,
  busy,
  act,
  assess,
  ready,
}: SessionProps & { next: Next; assess: () => Promise<void>; ready: boolean }) {
  const [initialRevision] = useState(session.revision);
  // Accepted answers advance the revision, including edits and skipped prompts.
  const responseCount = Math.max(0, session.revision - initialRevision);
  useEffect(() => {
    discoveryPoses.forEach((pose) => {
      const image = new Image();
      image.src = mascotAssets[pose];
    });
  }, []);
  const [editing, setEditing] = useState<string | null>(null),
    [value, setValue] = useState<AnswerValue>("");
  const question = next.active.find((q) => q.id === editing) ?? next.question;
  useEffect(() => {
    const saved = session.answers.find((a) => a.questionId === question?.id);
    setValue(saved?.value ?? (question?.type === "multi" ? [] : ""));
  }, [question?.id]);
  const idx = next.active.findIndex((q) => q.id === question?.id);
  async function save(answer: AnswerValue = value, skip = false) {
    if (!question || busy) return;
    const success = await act(() =>
      api(`/sessions/${session.id}/answers`, "PUT", {
        revision: session.revision,
        questionId: question.id,
        value: answer,
        skip,
      }),
    );
    if (success) setEditing(null);
  }
  function choose(option: string) {
    if (busy) return;
    if (question?.type === "single") {
      setValue(option);
      void save(option);
    } else
      setValue((current) => {
        const values = Array.isArray(current) ? current : [];
        return values.includes(option)
          ? values.filter((x) => x !== option)
          : option === "none"
            ? ["none"]
            : [...values.filter((x) => x !== "none"), option];
      });
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <DiscoveryScene
        key={`${question?.id ?? "ready"}:${session.revision}`}
        busy={busy}
      >
        <aside className="discovery-mascot">
          <Mascot
            state={discoveryPoses[responseCount % discoveryPoses.length]}
          />
        </aside>
        <section className="question-section" aria-busy={busy}>
          {question ? (
            <>
              <h1>{question.title}</h1>
              <p className="question-description">
                {question.id === "stage"
                  ? "Whether you're running a business, developing an idea, or looking for a specific solution, choose what best describes your situation. We'll tailor the experience from there"
                  : question.hint}
              </p>
              <fieldset className="question-input" disabled={busy}>
                <legend className="sr-only">{question.title}</legend>
                {question.type === "text" ? (
                  <textarea
                    aria-label={question.title}
                    rows={4}
                    maxLength={4000}
                    value={typeof value === "string" ? value : ""}
                    placeholder="In your own words…"
                    onChange={(e) => setValue(e.target.value)}
                  />
                ) : (
                  <div className="choices">
                    {question.options?.map((o) => {
                      const selected = Array.isArray(value)
                        ? value.includes(o.value)
                        : value === o.value;
                      const label =
                        question.id === "stage"
                          ? (
                              {
                                established: "I own a business",
                                starting: "I have an idea",
                                uncertain: "I don’t know where to start",
                                specific: "I know exactly what I want",
                              } as Record<string, string>
                            )[o.value]
                          : o.label;
                      return (
                        <motion.label
                          key={o.value}
                          className={`choice glass-button ${selected ? "selected" : ""}`}
                          animate={{
                            opacity: busy && !selected ? 0.3 : 1,
                          }}
                        >
                          <input
                            type={
                              question.type === "multi" ? "checkbox" : "radio"
                            }
                            name={question.id}
                            checked={selected}
                            onChange={() => choose(o.value)}
                          />
                          <span>{label}</span>
                        </motion.label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
              <div className="actions">
                {(question.type !== "single" ||
                  (typeof value === "string" && value.length > 0)) && (
                  <button
                    className="glass-button"
                    disabled={
                      busy ||
                      (Array.isArray(value) ? !value.length : !value.trim())
                    }
                    onClick={() => void save()}
                  >
                    Continue
                  </button>
                )}
                {question.optional && (
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => void save("", true)}
                  >
                    Skip for now
                  </button>
                )}
                {idx > 0 && (
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => setEditing(next.active[idx - 1].id)}
                  >
                    Back
                  </button>
                )}
              </div>
              {busy && (
                <p className="processing" role="status">
                  Understanding what you’ve shared…
                </p>
              )}
            </>
          ) : (
            <div className="readiness">
              <h1>
                I think we have
                <br />
                somewhere to start.
              </h1>
              <p className="question-description">
                {ready
                  ? "I’ve put together an initial assessment based on what you’ve shared. We can keep exploring, or take a look."
                  : "There’s enough context for an initial assessment. We can keep exploring, or prepare it when you’re ready."}
              </p>
              {ready ? (
                <Link
                  className="glass-button"
                  to={sessionHref(session.id, "report")}
                >
                  Explore the analysis
                </Link>
              ) : (
                <button
                  className="glass-button"
                  disabled={busy}
                  onClick={() => void assess().catch(() => {})}
                >
                  Prepare the assessment
                </button>
              )}
            </div>
          )}
          <Link
            className="conversation-link text-link"
            to={sessionHref(session.id, "conversation")}
          >
            Have a conversation instead
          </Link>
          {session.answers.length > 0 && (
            <details className="answer-review">
              <summary>Revisit what you’ve shared</summary>
              {session.answers.map((a) => (
                <button
                  key={a.questionId}
                  disabled={busy}
                  onClick={() => setEditing(a.questionId)}
                >
                  <span>
                    {next.active.find((q) => q.id === a.questionId)?.title ??
                      a.questionId}
                  </span>
                  <small>
                    {a.skipped
                      ? "Skipped"
                      : Array.isArray(a.value)
                        ? a.value.join(", ")
                        : a.value}
                  </small>
                </button>
              ))}
            </details>
          )}
        </section>
      </DiscoveryScene>
    </AnimatePresence>
  );
}
