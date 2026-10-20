import { useRef, type ReactNode } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./SectionReveal.css";

type SectionRevealProps = {
  children: ReactNode;
};

export function SectionReveal({ children }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const entered = useInView(ref, {
    once: true,
    amount: 0.04,
  });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.82, 1],
    [0, 1, 1, 0],
  );

  return (
    <div ref={ref} className="section-reveal">
      <motion.div
        className="section-reveal__scroll"
        style={{
          opacity: reducedMotion ? 1 : opacity,
        }}
      >
        <motion.div
          className="section-reveal__entrance"
          initial={reducedMotion ? false : { opacity: 0, y: 34 }}
          animate={
            reducedMotion || entered
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 34 }
          }
          transition={{
            duration: 1.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
