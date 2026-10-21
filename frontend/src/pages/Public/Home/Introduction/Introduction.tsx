import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  animate,
  motion,
  useInView,
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

const introductionAvatars = [11, 12, 13, 14, 15, 16] as const;

function StatisticCard({
  statistic,
  featured,
}: {
  statistic: Statistic;
  featured: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once: true,
    amount: 0.35,
  });

  const [displayedCount, setDisplayedCount] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [32, 0, 0, -20]);

  useEffect(() => {
    if (!isInView) return;

    const target = Number.parseInt(statistic.value, 10);

    if (reducedMotion) {
      setDisplayedCount(target);
      return;
    }

    const animation = animate(0, target, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => {
        setDisplayedCount(Math.round(value));
      },
    });

    return () => animation.stop();
  }, [isInView, reducedMotion, statistic.value]);

  const formattedCount =
    String(displayedCount).padStart(
      statistic.value.startsWith("0") ? statistic.value.length : 1,
      "0",
    ) + (statistic.value.endsWith("+") ? "+" : "");

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
        <strong
          className="introduction-stat-value"
          aria-label={statistic.value}
        >
          {formattedCount}
        </strong>

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
            <p className="introduction-eyebrow"></p>

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
            <div className="introduction-avatars" aria-hidden="true">
              {introductionAvatars.map((number) => (
                <span className="introduction-avatar" key={number}>
                  <img
                    src={`/clients/${number}.jpeg`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </span>
              ))}
            </div>

            <p>
              Not every problem needs an app. Not every process needs AI.
              Sometimes the answer is a simpler workflow, two systems finally
              talking to each other, or an idea built properly from the start.
              We help work out which one it is.
            </p>

            <Link className="introduction-link" to="/about">
              See how we got here
            </Link>
          </div>
        </div>

        <div className="introduction-right">
          <div className="introduction-statement">
            <h3>
              We'd rather ask another question than build the wrong thing.
            </h3>

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
