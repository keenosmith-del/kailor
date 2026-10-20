import { useRef, type ReactNode } from "react";
import {
  motion,
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

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scrollOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.78, 1],
    [0, 1, 1, 0],
  );

  return (
    <div ref={ref} className="section-reveal">
      <motion.div
        className="section-reveal__scroll"
        style={{
          opacity: reducedMotion ? 1 : scrollOpacity,
        }}
      >
        <motion.div
          className="section-reveal__entrance"
          initial={reducedMotion ? false : { opacity: 0 }}
          whileInView={reducedMotion ? undefined : { opacity: 1 }}
          viewport={{
            once: true,
            amount: 0.05,
          }}
          transition={{
            duration: 1.15,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
