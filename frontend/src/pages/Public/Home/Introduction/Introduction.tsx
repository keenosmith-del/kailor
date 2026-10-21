import { useRef } from "react";
import { Link } from "react-router";
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
      "Years of experience spanning software development, cloud technology and intelligent systems.",
  },
  {
    label: "Technical disciplines",
    value: "05",
    description:
      "Connected areas of expertise, from consultancy and software to AI, automation and cloud.",
  },
  {
    label: "Starting points",
    value: "03",
    description:
      "Whether you're starting, improving or building, there's a way to begin.",
  },
];

type Statistic = (typeof statistics)[number];

function StatisticCard({
  statistic,
  featured,
}: {
  statistic: Statistic;
  featured: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [32, 0, 0, -20]);

  return (
    <motion.article
      ref={ref}
      className={`introduction-stat${
        featured ? " introduction-stat--featured" : ""
      }`}
      style={{
        opacity: reducedMotion ? 1 : opacity,
        y: reducedMotion ? 0 : y,
      }}
    >
      <span className="introduction-stat-label">{statistic.label}</span>

      <div className="introduction-stat-bottom">
        <strong className="introduction-stat-value">{statistic.value}</strong>
        <p>{statistic.description}</p>
      </div>
    </motion.article>
  );
}

export function Introduction() {
  return (
    <section
      className="public-section home-introduction"
      id="introduction"
      aria-labelledby="introduction-title"
    >
      <div className="introduction-layout">
        <div className="introduction-left">
          <div>
            <p className="introduction-eyebrow">
          
            </p>

            <h2 id="introduction-title">
              Why
              <br />
              kailor
              <span className="kailor-round-dot" aria-hidden="true" />
            </h2>

            <div className="introduction-disciplines">
              <span>Technology consultancy</span>
              <span>Software engineering</span>
              <span>Artificial intelligence and automation</span>
              <span>Cloud infrastructure</span>
            </div>
          </div>

          <div className="introduction-left-bottom">
            <p>
              One place to understand the challenge, identify the opportunity
              and build something that makes a difference.
            </p>

            <Link className="introduction-link" to="/about">
              Discover
            </Link>
          </div>
        </div>

        <div className="introduction-right">
          <div className="introduction-statement">
            <h3>Technology should move your business forward.</h3>

            <p>
              kailor combines practical business consultancy with hands-on
              software, AI and cloud engineering. We help individuals,
              entrepreneurs and established organisations turn ideas,
              operational challenges and technical requirements into considered
              solutions.
            </p>
          </div>

          <div className="introduction-statistics">
            {statistics.map((statistic, index) => (
              <StatisticCard
                key={statistic.label}
                statistic={statistic}
                featured={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
