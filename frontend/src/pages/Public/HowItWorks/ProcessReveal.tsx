import { useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

// Match the homepage's reversible scroll fades, measuring a stationary wrapper
// so the illustration's own pill motion never changes its scroll progress.
export function ProcessReveal({
  children,
  className = "",
  settle = 0.16,
}: {
  children: ReactNode;
  className?: string;
  settle?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(
    scrollYProgress,
    [0, settle, 0.82, 1],
    [0, 1, 1, 0],
  );
  const y = useTransform(
    scrollYProgress,
    [0, settle, 0.82, 1],
    [20, 0, 0, -16],
  );
  return (
    <div ref={ref} className={className}>
      <motion.div
        className="hiw-scroll-content"
        style={{ opacity: reduced ? 1 : opacity, y: reduced ? 0 : y }}
      >
        {children}
      </motion.div>
    </div>
  );
}
