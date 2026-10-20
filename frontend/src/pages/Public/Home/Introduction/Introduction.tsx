import { useRef } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./Introduction.css";

const statistics = [
  {
    label: "Engineering experience",
    value: "6+",
    description:
      "Years of hands-on experience across software engineering and technology.",
    featured: true,
  },
  {
    label: "Connected expertise",
    value: "05",
    description:
      "Service disciplines brought together around your requirements.",
    featured: false,
  },
  {
    label: "Ways to begin",
    value: "03",
    description:
      "Starting points, from a new idea to a specific technical challenge.",
    featured: false,
  },
];

export function Introduction() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.82, 1],
    [0, 1, 1, 0],
  );

  const translateY = useTransform(
    scrollYProgress,
    [0, 0.18, 0.82, 1],
    [35, 0, 0, -20],
  );

  return (
    <section
      ref={sectionRef}
      className="public-section home-introduction"
      id="introduction"
      aria-labelledby="introduction-title"
    >
      <motion.div
        className="introduction-layout"
        style={{
          opacity: reducedMotion ? 1 : opacity,
          y: reducedMotion ? 0 : translateY,
        }}
      >
        <div className="introduction-left">
          <div className="introduction-heading">
            <span className="introduction-eyebrow">
              Independent thinking. Connected expertise.
            </span>

            <h2 id="introduction-title">
              Why
              <br />
              kailor.
            </h2>

            <div className="introduction-disciplines">
              <span>Software engineering</span>
              <span>Artificial intelligence</span>
              <span>Automation and cloud</span>
              <span>Technology consulting</span>
            </div>
          </div>

          <div className="introduction-left-bottom">
            <p>
              One place to explore the problem, understand your options and work
              towards the right solution.
            </p>

            <Link className="introduction-link" to="/about">
              More about kailor
            </Link>
          </div>
        </div>

        <div className="introduction-right">
          <div className="introduction-statement">
            <h3>
              Good ideas deserve
              <br />
              more than guesswork.
            </h3>

            <p>
              From your first business idea to an established operation ready
              for something better, kailor brings consultancy, engineering and
              intelligent technology together to help you move forward with
              purpose.
            </p>
          </div>

          <div className="introduction-statistics">
            {statistics.map((stat) => (
              <article
                key={stat.label}
                className={`introduction-stat${
                  stat.featured ? " introduction-stat--featured" : ""
                }`}
              >
                <span className="introduction-stat-label">
                  <span
                    className="introduction-stat-marker"
                    aria-hidden="true"
                  />
                  {stat.label}
                </span>

                <div className="introduction-stat-bottom">
                  <strong className="introduction-stat-value">
                    {stat.value}
                  </strong>

                  <p>{stat.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
