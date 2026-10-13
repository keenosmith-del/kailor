import { ArrowLeft,ArrowRight,Check } from "lucide-react";
import { AnimatePresence,motion } from "motion/react";
import { useEffect,useState } from "react";
import { Link } from "react-router";
import type { AnswerValue } from "../../shared/src/index";
import { api } from "./api";
import { Mascot } from "./Mascot";
import type { Next,SessionProps } from "./types";
export function Discovery({
  session,
  next,
  busy,
  act,
  assess,
}: SessionProps & { next: Next; assess: () => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null),
    [value, setValue] = useState<AnswerValue>("");
  const question = next.active.find((q) => q.id === editing) ?? next.question;
  useEffect(() => {
    const answer = session.answers.find((a) => a.questionId === question?.id);
    setValue(answer?.value ?? (question?.type === "multi" ? [] : ""));
  }, [question?.id, session.revision]);
  const idx = next.active.findIndex((q) => q.id === question?.id);
  async function save(skip = false) {
    if (!question) return;
    await act(async () => {
      await api(`/sessions/${session.id}/answers`, "PUT", {
        revision: session.revision,
        questionId: question.id,
        value,
        skip,
      });
      setEditing(null);
    });
  }
  return (
    <div className="discovery-layout">
      <aside className="discovery-aside">
        <p className="eyebrow">a conversation with purpose</p>
        <Mascot state={busy ? "thinking" : "attentive"} />
        <p className="aside-note">
          We’ll start with your world.
          <br />
          The technology comes after.
        </p>
        <Link className="text-link" to={`/sessions/${session.id}/conversation`}>
          Rather talk it through? <ArrowRight size={15} />
        </Link>
      </aside>
      <section className="question-section">
        <div className="progress-caption">
          <span>Your discovery</span>
          <span>
            {next.answered} / {next.total}
          </span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Discovery progress"
          aria-valuenow={next.answered}
          aria-valuemin={0}
          aria-valuemax={next.total}
        >
          <div style={{ width: `${(100 * next.answered) / next.total}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={question?.id ?? "complete"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {question ? (
              <>
                <p className="eyebrow">
                  {question.optional
                    ? "a little more context · optional"
                    : "one step at a time"}
                </p>
                <h1 className="question-title">{question.title}</h1>
                <p className="muted">{question.hint}</p>
                <fieldset className="question-input">
                  <legend className="sr-only">{question.title}</legend>
                  {question.type === "text" ? (
                    <textarea
                      aria-label={question.title}
                      rows={5}
                      maxLength={4000}
                      placeholder="In your own words…"
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  ) : (
                    question.options?.map((o) => {
                      const selected = Array.isArray(value)
                        ? value.includes(o.value)
                        : value === o.value;
                      return (
                        <label
                          className={`choice ${selected ? "selected" : ""}`}
                          key={o.value}
                        >
                          <input
                            type={
                              question.type === "multi" ? "checkbox" : "radio"
                            }
                            name={question.id}
                            checked={selected}
                            value={o.value}
                            onChange={() =>
                              setValue(
                                question.type === "single"
                                  ? o.value
                                  : selected
                                    ? (value as string[]).filter(
                                        (x) => x !== o.value,
                                      )
                                    : o.value === "none"
                                      ? ["none"]
                                      : [
                                          ...(Array.isArray(value)
                                            ? value.filter((v) => v !== "none")
                                            : []),
                                          o.value,
                                        ],
                              )
                            }
                          />
                          <span>{o.label}</span>
                          <span className="choice-mark">
                            {selected && <Check size={15} />}
                          </span>
                        </label>
                      );
                    })
                  )}
                </fieldset>
                <div className="actions">
                  <button
                    className="button primary"
                    disabled={
                      busy ||
                      (Array.isArray(value)
                        ? value.length === 0
                        : !value.trim())
                    }
                    onClick={() => void save()}
                  >
                    Continue <ArrowRight size={17} />
                  </button>
                  {question.optional && (
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => void save(true)}
                    >
                      Skip for now
                    </button>
                  )}
                  {idx > 0 && (
                    <button
                      className="text-link back-button"
                      disabled={busy}
                      onClick={() => setEditing(next.active[idx - 1].id)}
                    >
                      <ArrowLeft size={15} /> Back
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="complete">
                <p className="eyebrow">a clearer picture</p>
                <h1>
                  Possibility,
                  <br />
                  taking shape.
                </h1>
                <p className="lead">
                  Your context is ready for a first assessment. Every
                  recommendation remains open to discussion.
                </p>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => void assess()}
                >
                  Prepare my analysis <ArrowRight size={17} />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {session.answers.length > 0 && (
          <details className="answer-review">
            <summary>Review & edit your answers</summary>
            {session.answers.map((a) => (
              <button
                key={a.questionId}
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
        {next.referenceHints.length > 0 && (
          <details className="answer-review">
            <summary>Questions worth considering</summary>
            {next.referenceHints.map((h, i) => (
              <p key={i}>
                {h.question}
                <small>
                  Reference only: {h.source}. {h.reason}.
                </small>
              </p>
            ))}
          </details>
        )}
      </section>
    </div>
  );
}
