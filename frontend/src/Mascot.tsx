import { motion,useReducedMotion } from "motion/react";
export type MascotState =
  | "greeting"
  | "curious"
  | "attentive"
  | "thinking"
  | "conversation"
  | "recommendation"
  | "completed";
export function Mascot({
  state,
  assets = {},
}: {
  state: MascotState;
  assets?: Partial<Record<MascotState, string>>;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="mascot"
      aria-label={`Mascot space: ${state}`}
      animate={reduced ? {} : { opacity: [0.75, 1, 0.75] }}
      transition={{ duration: 5, repeat: Infinity }}
    >
      {assets[state] ? (
        <img src={assets[state]} alt={`kailor mascot, ${state}`} />
      ) : (
        <div className="mascot-placeholder">
          <span className="mascot-line" />
          <small>space for a little personality</small>
          <span className="mascot-state">{state}</span>
        </div>
      )}
    </motion.div>
  );
}
