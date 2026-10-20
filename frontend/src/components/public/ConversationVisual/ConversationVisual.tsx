import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { UserRound } from "lucide-react";

import "./ConversationVisual.css";

type ConversationEvent =
  | {
      kind: "message";
      id: string;
      role: "visitor" | "kailor";
      text: string;
      duration: number;
    }
  | {
      kind: "thinking";
      id: string;
      duration: number;
    };

const sequence: ConversationEvent[] = [
  {
    kind: "message",
    id: "visitor-1",
    role: "visitor",
    text: "I run a small business, but enquiries are scattered across email and messages.",
    duration: 2600,
  },
  {
    kind: "thinking",
    id: "thinking-1",
    duration: 1300,
  },
  {
    kind: "message",
    id: "kailor-1",
    role: "kailor",
    text: "How are you tracking enquiries now? And what happens when someone needs a follow-up?",
    duration: 3400,
  },
  {
    kind: "message",
    id: "visitor-2",
    role: "visitor",
    text: "Mostly a spreadsheet. I keep forgetting who I've replied to and what needs doing next.",
    duration: 3000,
  },
  {
    kind: "thinking",
    id: "thinking-2",
    duration: 1600,
  },
  {
    kind: "message",
    id: "kailor-2",
    role: "kailor",
    text: "We can map that workflow, bring the enquiries together and explore automated follow-ups. First, we'll see whether an existing platform fits or if a tailored solution makes more sense.",
    duration: 7000,
  },
];

export function ConversationVisual() {
  const ref = useRef<HTMLDivElement>(null);

  const visible = useInView(ref, {
    amount: 0.15,
  });

  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!visible || paused || reducedMotion) return;

    const timeout = window.setTimeout(() => {
      setStep((current) => (current + 1) % sequence.length);
    }, sequence[step].duration);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [visible, paused, reducedMotion, step]);

  const events = reducedMotion ? sequence : sequence.slice(0, step + 1);

  const visibleMessages = events.filter(
    (event): event is Extract<ConversationEvent, { kind: "message" }> =>
      event.kind === "message",
  );

  const thinking =
    !reducedMotion && visible && sequence[step].kind === "thinking";

  return (
    <div className="kailor-chat" ref={ref}>

      <p className="sr-only">
        A scripted preview of a conversation about business enquiries and
        follow-up processes.
      </p>

      <div className="kailor-chat__thread" aria-hidden="true">
        {visibleMessages.map((message) => {
          const isVisitor = message.role === "visitor";

          return (
            <div
              key={message.id}
              className={`kailor-chat__message ${
                isVisitor
                  ? "kailor-chat__message--visitor"
                  : "kailor-chat__message--kailor"
              }`}
            >
              <div className="kailor-chat__avatar">
                {isVisitor ? (
                  <UserRound size={21} strokeWidth={1.6} />
                ) : (
                  <img src="/kailor-head.png" alt="" width={35} height={35} />
                )}
              </div>

              <div className="kailor-chat__bubble">
                <span className="kailor-chat__name">
                  {isVisitor ? "You" : "kailor"}
                </span>

                <p>{message.text}</p>
              </div>
            </div>
          );
        })}

        {thinking && (
          <div className="kailor-chat__thinking">
            <div className="kailor-chat__avatar">
              <img src="/kailor-head.png" alt="" width={35} height={35} />
            </div>

            <div className="kailor-chat__thinking-bubble">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
