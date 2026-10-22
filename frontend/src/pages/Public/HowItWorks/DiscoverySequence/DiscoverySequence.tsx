import { useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useDocumentVisible } from "../../../../components/public/useDocumentVisible";
import "./DiscoverySequence.css";

const groups = [
  {
    question: "Which best describes you?",
    choices: [
      "I own a business",
      "I have an idea",
      "I don't know where to start",
      "I know exactly what I want",
    ],
  },
  {
    question: "What needs attention?",
    choices: ["Orders and stock", "Internal processes", "Our online presence"],
  },
  {
    question: "What's getting in the way?",
    choices: [
      "Stock records don't match",
      "Too many separate tools",
      "Information is hard to find",
    ],
  },
  {
    question: "What do you use now?",
    choices: [
      "Online store and spreadsheets",
      "A single shared system",
      "Mostly manual records",
    ],
  },
  {
    question: "What would you like to change?",
    choices: [
      "Less manual updating",
      "Clearer reporting",
      "A simpler daily workflow",
    ],
  },
];
export const recommendation =
  "Your orders and stock information are being managed in different places. I'd start by looking at how your existing store and spreadsheets could work together. A connected inventory workflow may solve the immediate problem without needing an entirely new system.";
const groupDuration = 3000;
const dissolveAt = 16200;
const thinkingAt = 16700;
const typingAt = 18000;
const completedAt = typingAt + recommendation.length * 17;
const fadeAt = completedAt + 7000;
export const discoveryCycleDuration = fadeAt + 500;
const ease = [0.22, 1, 0.36, 1] as const;

export function DiscoverySequence() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const documentVisible = useDocumentVisible();
  const reduced = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const groupId = useId();
  const playing = inView && documentVisible && !reduced;
  // One clock loops after a readable final hold and a gentle dissolve.
  // Offscreen/hidden pauses preserve progress; unmount clears the clock.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setElapsed((value) => (value + 40) % discoveryCycleDuration),
      40,
    );
    return () => window.clearInterval(timer);
  }, [playing]);
  const time = reduced ? completedAt : elapsed;
  const step = Math.min(groups.length - 1, Math.floor(time / groupDuration));
  const within = time % groupDuration;
  const gathered = Math.min(
    groups.length,
    Math.floor(time / groupDuration) + (within >= 1800 ? 1 : 0),
  );
  const showingChoices = time < groups.length * groupDuration;
  const response = time >= thinkingAt;
  const thinking = time < typingAt;
  const characters = Math.max(0, Math.floor((time - typingAt) / 17));
  return (
    <div
      className="discovery-sequence"
      ref={ref}
      data-phase={
        reduced || time >= completedAt
          ? "complete"
          : response
            ? thinking
              ? "thinking"
              : "typing"
            : time >= dissolveAt
              ? "dissolving"
              : "questions"
      }
    >
      <p className="hiw-caption">Discovery · Scripted retail example</p>
      <p className="sr-only">
        An independent online retailer wants consistent orders and stock records
        across an online store and spreadsheets, with less manual updating. This
        is an illustration, not a live assessment.
      </p>
      <div className="discovery-sequence-stage">
        <LayoutGroup id={groupId}>
          <AnimatePresence>
            {time < dissolveAt && (
              <motion.div
                className="discovery-sequence-questions"
                key="questions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                aria-hidden="true"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease }}
              >
                <div className="discovery-sequence-gathered">
                  {groups.slice(0, gathered).map((group, index) => (
                    <motion.span
                      className="discovery-gathered-pill"
                      key={group.question}
                      layoutId={`answer-${index}`}
                      transition={{ duration: 0.55, ease }}
                    >
                      {group.choices[0]}
                    </motion.span>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  {showingChoices && within < 1800 && (
                    <motion.div
                      className="discovery-question-group"
                      key={step}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease }}
                    >
                      <p className="discovery-question-title">
                        {groups[step].question}
                      </p>
                      <div className="discovery-question-pills">
                        {groups[step].choices.map((choice, index) => (
                          <motion.span
                            key={choice}
                            layoutId={
                              index === 0 ? `answer-${step}` : undefined
                            }
                            className={`discovery-choice${within >= 1200 && index === 0 ? " is-selected" : ""}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{
                              opacity: within >= 1200 && index !== 0 ? 0.25 : 1,
                              y: 0,
                              scale:
                                within >= 1200 && within < 1400 && index === 0
                                  ? 0.97
                                  : 1,
                            }}
                            transition={{
                              duration: 0.3,
                              ease,
                              delay: within < 1200 ? index * 0.045 : 0,
                            }}
                          >
                            {choice}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {time >= 15000 && (
                  <motion.p
                    className="discovery-context-ready"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    A clearer picture of the work that needs attention.
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
        {response && (
          <motion.div
            className="discovery-response"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: !reduced && time >= fadeAt ? 0 : 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.4, ease }}
          >
            <img src="/mascot-head.png" width={42} height={42} alt="" />
            <div className="discovery-response-bubble">
              <span className="discovery-response-name">kailor</span>
              <p className="sr-only">{recommendation}</p>
              <div className="discovery-response-text" aria-hidden="true">
                <p className="discovery-response-reserve">{recommendation}</p>
                <p className="discovery-response-typed">
                  {thinking ? "" : recommendation.slice(0, characters)}
                </p>
                {thinking && (
                  <span
                    className={`discovery-thinking${playing ? "" : " is-paused"}`}
                  >
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <p className="hiw-caption discovery-sequence-note">
        Illustration, not a live assessment
      </p>
    </div>
  );
}
