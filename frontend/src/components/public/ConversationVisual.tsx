import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Pause, Play, RotateCcw, UserRound } from "lucide-react";
const messages = [
  {
    role: "visitor",
    text: "I spend more time following up than doing the actual work.",
  },
  {
    role: "kailor",
    text: "Let's look at where that time goes. How do you currently keep track of enquiries?",
  },
  {
    role: "visitor",
    text: "Mostly messages, a spreadsheet and a few things I try to remember.",
  },
  {
    role: "kailor",
    text: "A simpler process may be enough. We can compare existing tools before deciding whether anything needs to be built.",
  },
];
export function ConversationVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.25 });
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false),
    [stage, setStage] = useState(1);
  useEffect(() => {
    if (!visible || paused || reduced || stage >= messages.length) return;
    const timer = setTimeout(() => setStage((s) => s + 1), 2800);
    return () => clearTimeout(timer);
  }, [visible, paused, reduced, stage]);
  const count = reduced ? messages.length : stage;
  return (
    <div className="conversation-visual" ref={ref}>
      <div className="conversation-caption">
        <span>Illustrative conversation</span>
        <div className="conversation-controls">
          {!reduced && (
            <button
              className="pub-icon"
              aria-label={paused ? "Play conversation" : "Pause conversation"}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          <button
            className="pub-icon"
            aria-label="Restart conversation"
            onClick={() => {
              setStage(1);
              setPaused(false);
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div className="conversation-messages">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`demo-message demo-${message.role} ${i < count ? "is-visible" : ""}`}
            aria-hidden={i >= count}
          >
            <span className="demo-avatar">
              {message.role === "visitor" ? (
                <UserRound size={22} strokeWidth={1.4} />
              ) : (
                <img
                  src="/mascot/heads/kailor-head-neutral.png"
                  alt="kailor"
                  loading="lazy"
                />
              )}
            </span>
            <div className="demo-bubble">
              <span>{message.role === "visitor" ? "You" : "kailor"}</span>
              <p>{message.text}</p>
            </div>
          </div>
        ))}
        {count < messages.length && (
          <div
            className={`thinking ${paused || !visible ? "is-paused" : ""}`}
            aria-label="The illustration is thinking"
          >
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
      <p className="demo-note">
        A scripted example of the approach. No live AI responses.
      </p>
    </div>
  );
}
