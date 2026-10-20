import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./Consultants.css";

type Consultant = {
  name: string;
  initials: string;
  role: string;
  description: string;
  expertise: string;
  portrait: string;
};

const consultants: Consultant[] = [
  {
    name: "Jillian Martlouw",
    initials: "JM",
    role: "Business & Technology Consultant",
    description:
      "Connecting business priorities, operational challenges and emerging opportunities with practical technology strategies.",
    expertise: "Business strategy · Digital transformation",
    portrait: "",
  },
  {
    name: "Keeno Smith",
    initials: "KS",
    role: "Founder · Software & AI Engineer",
    description:
      "Bringing software engineering, artificial intelligence and cloud technology together to design thoughtful, reliable solutions.",
    expertise: "Software engineering · AI · Cloud",
    portrait: "",
  },
  {
    name: "Seth Sarlie",
    initials: "SS",
    role: "Cloud & Systems Consultant",
    description:
      "Exploring the infrastructure, connected systems and technical foundations that support dependable digital operations.",
    expertise: "Cloud architecture · Systems integration",
    portrait: "",
  },
];

export function Consultants() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.16, 0.8, 1],
    [0, 1, 1, 0],
  );

  const y = useTransform(scrollYProgress, [0, 0.16, 0.8, 1], [30, 0, 0, -30]);

  return (
    <section
      ref={sectionRef}
      className="public-section home-consultants"
      id="consultants"
      aria-labelledby="consultants-title"
    >
      <motion.div
        className="consultants-inner"
        style={{
          opacity: reducedMotion ? 1 : opacity,
          y: reducedMotion ? 0 : y,
        }}
      >
        <motion.div
          className="consultants-heading"
          initial={reducedMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <h2 id="consultants-title">
            The people behind kailor
            <span className="consultants-heading-dot" aria-hidden="true" />
          </h2>

          <p>
            A considered approach starts with the right people. Bringing
            together business understanding, technical expertise and a shared
            commitment to purposeful solutions.
          </p>
        </motion.div>

        <div className="consultants-grid">
          {consultants.map((consultant, index) => (
            <motion.div
              className="consultant-entry"
              key={consultant.name}
              initial={reducedMotion ? false : { opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: reducedMotion ? 0 : 0.85,
                delay: reducedMotion ? 0 : index * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <article
                className={`consultant-card${
                  index === 1 ? " consultant-card--featured" : ""
                }`}
              >
                <div className="consultant-portrait">
                  {consultant.portrait ? (
                    <img
                      src={consultant.portrait}
                      alt={consultant.name}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="consultant-portrait-placeholder"
                      role="img"
                      aria-label={`Portrait of ${consultant.name} to be added`}
                    >
                      <span>{consultant.initials}</span>
                    </div>
                  )}
                </div>

                <div className="consultant-card-content">
                  <h3>{consultant.name}</h3>

                  <p className="consultant-role">{consultant.role}</p>

                  <p className="consultant-description">
                    {consultant.description}
                  </p>

                  <p className="consultant-expertise">{consultant.expertise}</p>
                </div>
              </article>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
