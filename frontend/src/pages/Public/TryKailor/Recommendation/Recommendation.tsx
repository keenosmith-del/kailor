import { useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Workflow,
  Network,
  PanelsTopLeft,
  Sparkles,
  Search,
  Compass,
  Cloud,
} from "lucide-react";
import type { RecommendationContent } from "../Simulation/recommendationRules";
import type { Phase } from "../Simulation/simulationState";
import "./Recommendation.css";
const icons = {
  workflow: Workflow,
  integration: Network,
  digital: PanelsTopLeft,
  ai: Sparkles,
  technical: Search,
  idea: Compass,
  cloud: Cloud,
};
export function Recommendation({
  content,
  phase,
  characters,
}: {
  content: RecommendationContent;
  phase: Phase;
  characters: number;
}) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const Icon = icons[content.id];
  const thinking = phase === "thinking";
  return (
    <motion.div
      className="try-response"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="try-message-row">
        <img src="/mascot-head.png" alt="kailor" width={44} height={44} />
        <div className="try-message">
          <div className="sr-only" role="status">
            {thinking ? "Considering your choices" : content.message}
          </div>
          <div className="try-message-text" aria-hidden="true">
            <p className="try-message-reserve">{content.message}</p>
            <p className="try-message-typed">
              {thinking ? (
                <span className="try-thinking">
                  <i />
                  <i />
                  <i />
                </span>
              ) : phase === "complete" ? (
                content.message
              ) : (
                content.message.slice(0, characters)
              )}
            </p>
          </div>
        </div>
      </div>
      {phase === "complete" && (
        <motion.div
          className="try-solution"
          onKeyDown={(event) => {
            if (event.key === "Escape" && expanded) {
              setExpanded(false);
              trigger.current?.focus();
            }
          }}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? 0 : 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="try-solution-label">
            <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
            <span>Possible direction</span>
          </div>
          <h3>{content.direction}</h3>
          <p>{content.description}</p>
          <button
            type="button"
            ref={trigger}
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Close direction" : "Explore this direction"}
          </button>
          {expanded && (
            <div
              id={id}
              className="try-direction-details"
              role="region"
              aria-label="Direction details"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setExpanded(false);
                  trigger.current?.focus();
                }
              }}
            >
              <h4>Why this direction</h4>
              <p>{content.why}</p>
              <h4>What to understand next</h4>
              <p>{content.next}</p>
              <h4>During proper Discovery</h4>
              <p>{content.discovery}</p>
              <p className="try-detail-note">
                These choices suggest a starting point. We haven't inspected
                your systems. Requirements, scope and a proposal would need
                review and agreement before any implementation is commissioned.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
