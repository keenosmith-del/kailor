import { useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
export function TimelineReveal({
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
    [0, settle, 0.86, 1],
    [0, 1, 1, 0],
  );
  const y = useTransform(
    scrollYProgress,
    [0, settle, 0.86, 1],
    [22, 0, 0, -18],
  );
  return (
    <div ref={ref} className={className}>
      <motion.div
        className="timeline-reveal-content"
        style={{ opacity: reduced ? 1 : opacity, y: reduced ? 0 : y }}
      >
        {children}
      </motion.div>
    </div>
  );
}
