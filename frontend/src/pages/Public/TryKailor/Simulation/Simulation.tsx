import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useReducedMotion,
  useIsPresent,
} from "motion/react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useDocumentVisible } from "../../../../components/public/useDocumentVisible";
import { chosenAt, questionAt } from "./simulationData";
import {
  initialSimulation,
  simulationReducer,
  type Phase,
} from "./simulationState";
import { recommend } from "./recommendationRules";
import { Recommendation } from "../Recommendation/Recommendation";
import { SimulationClosing } from "../SimulationClosing/SimulationClosing";
import "./Simulation.css";
const ease = [0.22, 1, 0.36, 1] as const;
function QuestionScene({
  children,
  onReady,
  reduced,
}: {
  children: ReactNode;
  onReady: () => void;
  reduced: boolean | null;
}) {
  const present = useIsPresent();
  useEffect(() => {
    if (present && reduced) onReady();
  }, [present, reduced]);
  return (
    <motion.div
      inert={!present}
      aria-hidden={!present}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -6 }}
      transition={{ duration: reduced ? 0 : 0.22, ease }}
      onAnimationComplete={() => {
        if (present) onReady();
      }}
    >
      {children}
    </motion.div>
  );
}
export function Simulation({
  startRef,
}: {
  startRef: React.RefObject<(() => void) | null>;
}) {
  const [state, dispatch] = useReducer(simulationReducer, initialSimulation);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const resultRef = useCallback((node: HTMLHeadingElement | null) => {
    resultHeading.current = node;
    node?.focus({ preventScroll: true });
  }, []);
  const visible = useDocumentVisible();
  const inView = useInView(ref, { amount: 0.08 });
  const active = visible && inView;
  const id = useId();
  const result = recommend(state.answers);
  const question = questionAt(state.answers, state.index)!;
  const response = ["thinking", "typing", "complete"].includes(state.phase);
  const showingQuestions = ["intro", "questions", "selecting"].includes(
    state.phase,
  );
  function begin() {
    if (state.phase === "intro") dispatch({ type: "start" });
    ref.current?.scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "center",
    });
    if (state.phase !== "intro")
      heading.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    startRef.current = begin;
    return () => {
      startRef.current = null;
    };
  });
  useEffect(() => {
    if (state.phase === "questions")
      heading.current?.focus({ preventScroll: true });
    if (state.phase === "thinking")
      resultHeading.current?.focus({ preventScroll: true });
  }, [state.phase, state.index]);
  useEffect(() => {
    if (!active && !reduced) return;
    let next: Phase | undefined;
    let delay = 0;
    if (state.phase === "selecting") delay = 360;
    if (state.phase === "summary") {
      next = "dissolving";
      delay = 850;
    }
    if (state.phase === "dissolving") {
      next = "thinking";
      delay = 420;
    }
    if (state.phase === "thinking") {
      next = "typing";
      delay = 850;
    }
    if (state.phase === "typing" && result) {
      if (state.characters >= result.message.length) next = "complete";
      else
        delay = /[.,?!]/.test(result.message[state.characters - 1] || "")
          ? 65
          : 18;
    }
    if (
      !["selecting", "summary", "dissolving", "thinking", "typing"].includes(
        state.phase,
      )
    )
      return;
    const advance = () => {
      if (state.phase === "selecting") dispatch({ type: "settle" });
      else if (state.phase === "typing" && !next)
        dispatch({
          type: "type",
          characters: reduced ? result!.message.length : state.characters + 2,
        });
      else if (next) dispatch({ type: "advance", from: state.phase, to: next });
    };
    if (reduced) {
      advance();
      return;
    }
    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.characters, active, reduced, result?.message]);
  function restart() {
    dispatch({ type: "restart" });
    ref.current?.scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "start",
    });
  }
  return (
    <div className="try-simulation-wrap">
      <div
        className="try-simulation"
        ref={ref}
        data-phase={state.phase}
        aria-label="Interactive Discovery preview"
      >
        <div className="try-stage-top">
          <span>A simplified preview based on your choices</span>
          {state.phase !== "intro" && (
            <button type="button" onClick={restart} aria-label="Start again">
              <RotateCcw size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <LayoutGroup id={id}>
          <AnimatePresence mode="wait" initial={false}>
            {!response && (
              <motion.div
                key="choices-stage"
                className="try-choice-stage"
                animate={{
                  opacity: state.phase === "dissolving" ? 0 : 1,
                  y: state.phase === "dissolving" ? -8 : 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.35, ease }}
              >
                {state.answers.length > 0 && (
                  <div
                    className="try-gathered"
                    role="group"
                    aria-label="Your choices"
                  >
                    {state.answers.map((answer, index) => {
                      const choice = chosenAt(state.answers, index)!;
                      return (
                        <motion.button
                          key={answer.questionId}
                          layoutId={
                            showingQuestions && index === state.index
                              ? undefined
                              : `${answer.questionId}-${answer.choiceId}`
                          }
                          layout
                          type="button"
                          className="try-saved-answer"
                          aria-label={`Change answer ${index + 1}: ${choice.label}`}
                          disabled={
                            state.phase === "selecting" ||
                            state.phase === "dissolving"
                          }
                          onClick={() => dispatch({ type: "edit", index })}
                          transition={{ duration: reduced ? 0 : 0.42, ease }}
                        >
                          {choice.label}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
                {showingQuestions ? (
                  <div className="try-question-area">
                    <p className="try-progress">
                      {state.phase === "intro"
                        ? "Four choices, one possible direction"
                        : `Question ${state.index + 1} of 4`}
                    </p>
                    <AnimatePresence mode="wait" initial={false}>
                      <QuestionScene
                        key={question.id}
                        reduced={reduced}
                        onReady={() => {
                          if (state.phase === "questions")
                            heading.current?.focus({ preventScroll: true });
                        }}
                      >
                        <h2 ref={heading} tabIndex={-1}>
                          {question.title}
                        </h2>
                        <p className="try-question-note">{question.note}</p>
                        <div
                          className="try-choices"
                          role="group"
                          aria-label={question.title}
                        >
                          {question.choices.map((choice) => {
                            const selected =
                              state.pending === choice.id ||
                              (!state.pending &&
                                chosenAt(state.answers, state.index)?.id ===
                                  choice.id);
                            return (
                              <motion.button
                                type="button"
                                key={choice.id}
                                aria-pressed={selected}
                                disabled={state.phase === "selecting"}
                                layoutId={
                                  state.phase === "selecting" && selected
                                    ? `${question.id}-${choice.id}`
                                    : undefined
                                }
                                animate={{
                                  opacity:
                                    state.phase === "selecting" && !selected
                                      ? 0
                                      : 1,
                                  scale:
                                    state.phase === "selecting" &&
                                    selected &&
                                    !reduced
                                      ? 0.98
                                      : 1,
                                }}
                                transition={{
                                  duration: reduced ? 0 : 0.3,
                                  ease,
                                }}
                                onClick={() => {
                                  if (state.phase === "intro")
                                    dispatch({ type: "start" });
                                  dispatch({
                                    type: "choose",
                                    choiceId: choice.id,
                                  });
                                }}
                              >
                                {choice.label}
                              </motion.button>
                            );
                          })}
                        </div>
                      </QuestionScene>
                    </AnimatePresence>
                    <div className="try-question-navigation">
                      {state.index > 0 && (
                        <button
                          type="button"
                          disabled={state.phase === "selecting"}
                          onClick={() => dispatch({ type: "back" })}
                        >
                          <ArrowLeft size={13} aria-hidden="true" />
                          Previous question
                        </button>
                      )}
                      {state.phase === "questions" &&
                        chosenAt(state.answers, state.index) && (
                          <button
                            type="button"
                            onClick={() =>
                              dispatch({
                                type: "choose",
                                choiceId: chosenAt(state.answers, state.index)!
                                  .id,
                              })
                            }
                          >
                            Continue
                          </button>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="try-summary" role="status">
                    <h2>Your choices, brought together</h2>
                    <p>A moment to consider a possible starting point</p>
                  </div>
                )}
              </motion.div>
            )}
            {response && result && (
              <motion.div
                key="response-stage"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.35 }}
              >
                <h2
                  className="try-response-heading"
                  ref={resultRef}
                  tabIndex={-1}
                >
                  {result.title}
                </h2>
                <Recommendation
                  content={result}
                  phase={state.phase}
                  characters={state.characters}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
        {response && (
          <button
            className="try-review"
            type="button"
            onClick={() => dispatch({ type: "edit", index: 3 })}
          >
            Review your choices
          </button>
        )}
      </div>
      {state.phase === "complete" && <SimulationClosing restart={restart} />}
    </div>
  );
}
