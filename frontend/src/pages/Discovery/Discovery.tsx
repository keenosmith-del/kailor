import "./Discovery.css";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { MessageCircle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import type { AnswerValue } from "../../../../shared/src/index";
import { api, sessionHref, ApiError } from "../../services/api";
import { Mascot } from "../../components/Mascot/Mascot";
import {
  discoveryCompletionPose,
  discoveryPoseAssets,
} from "../../components/Mascot/mascot-assets";
import type { Next, SessionProps } from "../../types/session";
import { readDraft, saveDraft } from "../../utils/drafts";
const feedbackDuration = 0.34;

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
    <motion.section
      className="question-section"
      aria-hidden={!present}
      inert={!present || busy}
      initial={{ opacity: 0, y: reduced ? 0 : 14, scale: reduced ? 1 : 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduced ? 0 : -6, scale: reduced ? 1 : 1.015 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

export function Discovery({
  session,
  next,
  busy,
  act,
  assess,
  ready,
  restart,
}: SessionProps & {
  next: Next;
  assess: () => Promise<void>;
  ready: boolean;
  restart: () => Promise<void>;
}) {
  const reduced = useReducedMotion();
  const saving = useRef(false);
  const [submittedControl, setSubmittedControl] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const popAway = {
    opacity: reduced ? 1 : [1, 1, 1, 0],
    scale: reduced ? 1 : [1, 0.92, 1.08, 0.65],
    y: reduced ? 0 : [0, 1, -2, -8],
  };
  const feedbackTransition = {
    duration: reduced ? 0 : feedbackDuration,
    times: [0, 0.3, 0.55, 1],
  };
  const [initialRevision] = useState(session.revision);
  // Accepted answers advance the revision, including edits and skipped prompts.
  const responseCount = Math.max(0, session.revision - initialRevision);
  useEffect(() => {
    [...discoveryPoseAssets, discoveryCompletionPose].forEach((pose) => {
      const image = new Image();
      image.src = pose;
    });
  }, []);
  const [editing, setEditing] = useState<string | null>(null),
    [value, setValue] = useState<AnswerValue>("");
  const [recovering, setRecovering] = useState(false);
  const [validation, setValidation] = useState<ApiError | null>(null);
  const question =
    (editing && next.active.some((q) => q.id === editing)
      ? ([...(next.questionHistory ?? [])]
          .reverse()
          .find((h) => h.question.id === editing)?.question ??
        next.active.find((q) => q.id === editing))
      : undefined) ??
    (recovering ? next.completion.recoveryQuestion : next.question);
  useEffect(() => {
    const saved = session.answers.find((a) => a.questionId === question?.id);
    setValue(
      recovering
        ? ""
        : (readDraft(
            session.id,
            session.knowledgeRevision ?? session.revision,
            question?.id ?? "",
          ) ??
            saved?.value ??
            (question?.type === "multi" ? [] : "")),
    );
  }, [question?.id, recovering, session.id, session.revision]);
  const previousQuestion = [...session.answers]
    .reverse()
    .find(
      (a) =>
        a.questionId !== question?.id &&
        next.active.some((q) => q.id === a.questionId),
    );
  async function save(
    answer: AnswerValue = value,
    skip = false,
    control = "continue",
    responseState?: import("../../../../shared/src/index").AnswerState,
    resolveConflicts = false,
  ) {
    if (!question || busy || saving.current) return;
    saving.current = true;
    setSubmittedControl(control);
    try {
      const success = await act(
        async () => {
          // Let the pressed/pop feedback finish even when the API responds instantly.
          await Promise.all([
            api(`/sessions/${session.id}/answers`, "PUT", {
              revision: session.revision,
              questionId: question.id,
              value: answer,
              skip,
              responseState,
              resolveConflicts,
            }),
            new Promise((resolve) =>
              setTimeout(resolve, reduced ? 0 : feedbackDuration * 1000),
            ),
          ]);
        },
        (error) => {
          if (
            error instanceof ApiError &&
            ["input_quality", "input_conflict"].includes(error.code)
          ) {
            setValidation(error);
            if (error.code === "input_conflict") setEditing(question.id);
            return true;
          }
          return false;
        },
      );
      if (success) {
        saveDraft(
          session.id,
          session.knowledgeRevision ?? session.revision,
          question.id,
          "",
        );
        setEditing(null);
        setRecovering(false);
        setValidation(null);
      }
    } finally {
      saving.current = false;
      setSubmittedControl(null);
    }
  }
  function choose(option: string) {
    if (busy || saving.current) return;
    if (question?.type === "single") {
      setValue(option);
      void save(option, false, `choice:${option}`);
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
  async function prepare() {
    if (busy) return;
    setPreparing(true);
    try {
      await assess();
    } catch {
      // SessionPage displays the error; restore the current pose for a retry.
    } finally {
      setPreparing(false);
    }
  }
  return (
    <div className="discovery-layout">
      <div className="discovery-progress">
        <span role="status">
          {session.answers.length
            ? `${session.answers.length} responses saved · Questions adapt as we go`
            : "Choose your starting point"}
        </span>
        {session.answers.length > 0 && question?.id !== "stage" && (
          <button
            className="text-link"
            disabled={busy || !!session.plan?.archivedAt}
            onClick={() => void restart()}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            Start from beginning
          </button>
        )}
      </div>
      <aside className="discovery-mascot">
        <Mascot
          state="attentive"
          pose={
            !question && (preparing || ready)
              ? discoveryCompletionPose
              : discoveryPoseAssets[responseCount % discoveryPoseAssets.length]
          }
        />
      </aside>
      <AnimatePresence mode="wait" initial={false}>
        <DiscoveryScene
          key={`${question?.id ?? "ready"}:${session.revision}`}
          busy={busy}
        >
          <div aria-busy={busy}>
            {question?.id !== "stage" && (
              <button
                className="text-link"
                disabled={busy}
                onClick={() => {
                  setEditing("stage");
                  setRecovering(false);
                }}
              >
                Change starting situation
              </button>
            )}
            {question ? (
              <>
                <h1 tabIndex={-1}>{question.title}</h1>
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
                      rows={3}
                      maxLength={4000}
                      value={typeof value === "string" ? value : ""}
                      placeholder="In your own words…"
                      onChange={(e) => {
                        setValue(e.target.value);
                        saveDraft(
                          session.id,
                          session.knowledgeRevision ?? session.revision,
                          question.id,
                          e.target.value,
                        );
                        setValidation(null);
                      }}
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
                            className={`choice surface-button ${selected ? "selected" : ""}`}
                            whileHover={
                              busy || reduced
                                ? undefined
                                : { y: -2, scale: 1.015 }
                            }
                            whileTap={
                              busy || reduced
                                ? undefined
                                : { scale: 0.94, y: 1 }
                            }
                            animate={
                              submittedControl === `choice:${o.value}`
                                ? popAway
                                : {
                                    opacity: busy && !selected ? 0.3 : 1,
                                    scale: 1,
                                    y: 0,
                                  }
                            }
                            transition={
                              submittedControl === `choice:${o.value}`
                                ? feedbackTransition
                                : { duration: reduced ? 0 : 0.2 }
                            }
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
                {validation && (
                  <p className="question-description" role="alert">
                    {validation.message}
                  </p>
                )}
                {validation?.code === "input_conflict" && (
                  <div className="actions">
                    <button
                      className="discovery-action"
                      disabled={busy}
                      onClick={() =>
                        void save(value, false, "continue", undefined, true)
                      }
                    >
                      Confirm this correction
                    </button>
                  </div>
                )}
                <div className="actions">
                  {(question.type !== "single" ||
                    (typeof value === "string" && value.length > 0)) && (
                    <motion.button
                      className="discovery-action answer-control"
                      whileHover={
                        busy || reduced ? undefined : { y: -2, scale: 1.015 }
                      }
                      whileTap={
                        busy || reduced ? undefined : { scale: 0.94, y: 1 }
                      }
                      animate={
                        submittedControl === "continue"
                          ? popAway
                          : { opacity: 1, scale: 1, y: 0 }
                      }
                      transition={
                        submittedControl === "continue"
                          ? feedbackTransition
                          : { duration: reduced ? 0 : 0.2 }
                      }
                      disabled={
                        busy ||
                        (Array.isArray(value) ? !value.length : !value.trim())
                      }
                      onClick={() => void save()}
                    >
                      Continue
                    </motion.button>
                  )}
                  {question.type === "text" && (
                    <button
                      className="discovery-action"
                      disabled={busy}
                      onClick={() =>
                        void save(
                          "I don’t know yet.",
                          false,
                          "unknown",
                          "unknown",
                        )
                      }
                    >
                      I’m not sure yet
                    </button>
                  )}
                  {question.optional && (
                    <motion.button
                      className="discovery-action answer-control"
                      animate={
                        submittedControl === "skip"
                          ? popAway
                          : { opacity: 1, scale: 1, y: 0 }
                      }
                      transition={
                        submittedControl === "skip"
                          ? feedbackTransition
                          : { duration: reduced ? 0 : 0.2 }
                      }
                      whileHover={
                        busy || reduced ? undefined : { y: -2, scale: 1.015 }
                      }
                      whileTap={
                        busy || reduced ? undefined : { scale: 0.94, y: 1 }
                      }
                      disabled={busy}
                      onClick={() => void save("", true, "skip")}
                    >
                      Skip for now
                    </motion.button>
                  )}
                  {question.allowNotApplicable && (
                    <motion.button
                      className="discovery-action answer-control"
                      whileHover={
                        busy || reduced ? undefined : { y: -2, scale: 1.015 }
                      }
                      whileTap={
                        busy || reduced ? undefined : { scale: 0.94, y: 1 }
                      }
                      animate={
                        submittedControl === "not-applicable"
                          ? popAway
                          : { opacity: 1, scale: 1, y: 0 }
                      }
                      transition={
                        submittedControl === "not-applicable"
                          ? feedbackTransition
                          : { duration: reduced ? 0 : 0.2 }
                      }
                      disabled={busy}
                      onClick={() =>
                        void save(
                          "Not applicable",
                          false,
                          "not-applicable",
                          "not_applicable",
                        )
                      }
                    >
                      Not applicable
                    </motion.button>
                  )}
                  {previousQuestion && (
                    <button
                      className="discovery-action"
                      disabled={busy}
                      onClick={() => setEditing(previousQuestion.questionId)}
                    >
                      Back
                    </button>
                  )}
                </div>
              </>
            ) : !next.readiness.canAssess ? (
              <div className="readiness">
                <h1>We need a little more information.</h1>
                <p className="question-description">
                  {next.completion.state === "unsupported"
                    ? "This request needs qualified specialist review before I can recommend a solution."
                    : "I haven’t gathered enough detail to recommend a suitable solution yet. You can tell me more about what you’re working on, have a conversation, or begin again."}
                </p>
                {next.context.activity && (
                  <p className="question-description">
                    I have your context: {next.context.activity.slice(0, 180)}.
                  </p>
                )}
                <p className="question-description">
                  {next.readiness.reasons.join(" ")}
                </p>
                <div className="actions">
                  <button
                    className="discovery-action"
                    disabled={busy}
                    onClick={() => {
                      setRecovering(true);
                      setValue("");
                      setValidation(null);
                    }}
                  >
                    Tell kailor more
                  </button>
                  <Link
                    className="discovery-action"
                    to={sessionHref(session.id, "conversation")}
                  >
                    Have a conversation
                  </Link>
                  <button
                    className="discovery-action"
                    disabled={busy}
                    onClick={() => void restart()}
                  >
                    Start again
                  </button>
                </div>
              </div>
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
                    : next.readiness.canAssess
                      ? "There’s enough context for an initial assessment. We can keep exploring, or prepare it when you’re ready."
                      : next.readiness.reasons.join(" ")}
                </p>
                {ready ? (
                  <Link
                    className="discovery-action"
                    to={sessionHref(session.id, "report")}
                  >
                    Explore the analysis
                  </Link>
                ) : (
                  <button
                    className="discovery-action"
                    disabled={busy || !next.readiness.canAssess}
                    onClick={() => void prepare()}
                  >
                    Prepare the assessment
                  </button>
                )}
              </div>
            )}
            {question && next.readiness.canAssess && (
              <div className="readiness">
                <p className="question-description">
                  An initial assessment is available.{" "}
                  {next.readiness.uncertainties.join(" ")}
                </p>
                {ready ? (
                  <Link
                    className="discovery-action"
                    to={sessionHref(session.id, "report")}
                  >
                    Explore the analysis
                  </Link>
                ) : (
                  <button
                    className="discovery-action"
                    disabled={busy}
                    onClick={() => void prepare()}
                  >
                    Prepare the assessment
                  </button>
                )}
              </div>
            )}
            {(question || next.readiness.canAssess) && (
              <Link
                className="conversation-link text-link"
                to={sessionHref(session.id, "conversation")}
              >
                <MessageCircle size={15} strokeWidth={1.5} aria-hidden="true" />
                Have a conversation instead?
              </Link>
            )}
          </div>
        </DiscoveryScene>
      </AnimatePresence>
    </div>
  );
}
