import { useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import "./SectionReveal.css";
export function SectionReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.88, 1],
    [0, 1, 1, 0],
  );
  const y = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [20, 0, 0, -16]);
  return (
    <div ref={ref} className="section-reveal">
      <motion.div
        className="section-reveal__scroll"
        style={{ opacity: reduced ? 1 : opacity, y: reduced ? 0 : y }}
      >
        {children}
      </motion.div>
    </div>
  );
}
