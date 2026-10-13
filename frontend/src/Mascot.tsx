import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { mascotAssets } from "./mascot-assets";
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
  pose,
  variant = "body",
  assets = mascotAssets,
}: {
  state: MascotState;
  pose?: string;
  variant?: "body" | "head";
  assets?: Partial<Record<MascotState | "head", string>>;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const reduced = useReducedMotion();
  const source = pose ?? assets[variant === "head" ? "head" : state];
  return (
    <div className={`mascot mascot-${variant}`} aria-hidden="true">
      <AnimatePresence initial={false}>
        {source && !failed.includes(source) && (
          <motion.img
            key={source}
            src={source}
            alt=""
            onError={() => setFailed((previous) => [...previous, source])}
            initial={{ opacity: 0, y: reduced ? 0 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -3 }}
            transition={{ duration: reduced ? 0 : 0.35 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
