import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./Perspective.css";

import { perspectiveMetrics as insights } from "../homeMetrics";

export function Perspective() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.16, 0.78, 1],
    [0, 1, 1, 0],
  );

  const y = useTransform(scrollYProgress, [0, 0.16, 0.78, 1], [28, 0, 0, -24]);

  return (
    <section
      ref={sectionRef}
      className="public-section home-perspective"
      id="perspective"
      aria-labelledby="perspective-title"
    >
      <motion.div
        className="perspective-inner"
        style={{
          opacity: reducedMotion ? 1 : opacity,
          y: reducedMotion ? 0 : y,
        }}
      >
        <motion.div
          className="perspective-editorial"
          initial={reducedMotion ? false : { opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{
            once: false,
            amount: 0.15,
          }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <h2 id="perspective-title">The wider picture</h2>

          <div className="perspective-description">
            <p>
              Our work takes us into different industries, businesses and ways
              of working. Each brings its own challenges, expectations and
              opportunities. From individuals developing their first ideas to
              established organisations managing complex operations, the needs
              and circumstances are rarely the same.
            </p>

            <p>
              Working across these different environments broadens our
              perspective and influences how we approach new challenges. It
              allows us to draw on experience from different disciplines,
              explore alternative approaches and develop solutions that make
              sense for each situation.
            </p>
          </div>
        </motion.div>

        <div className="perspective-grid">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.label}
              className="perspective-tile-reveal"
              initial={reducedMotion ? false : { opacity: 0, y: 38 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{
                once: false,
                amount: 0.15,
              }}
              transition={{
                duration: 0.85,
                delay: reducedMotion ? 0 : index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.article
                className="perspective-tile"
                whileHover={reducedMotion ? undefined : { scale: 1.025, y: -4 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 26,
                }}
              >
                <h3>{insight.label}</h3>

                <strong className="perspective-value">{insight.value}</strong>

                <p>{insight.description}</p>
              </motion.article>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
