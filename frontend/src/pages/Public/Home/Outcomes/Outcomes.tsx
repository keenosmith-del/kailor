import { Compass, FileText, Layers, Workflow } from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import "./Outcomes.css";

const outcomes = [
  {
    id: "assessment",
    icon: Compass,
    short: "Understand",
    title: "Business assessment",
    description:
      "We look at how your business operates, the systems you rely on and the challenges affecting your day-to-day work. By examining processes, information and opportunities together, we establish what needs attention before deciding how technology should be involved.",
  },
  {
    id: "recommendations",
    icon: FileText,
    short: "Recommend",
    title: "Clear recommendations",
    description:
      "Not every challenge calls for custom software or artificial intelligence. We evaluate the available options, compare suitable technologies and recommend approaches that balance practical value, implementation costs, complexity and long-term requirements.",
  },
  {
    id: "architecture",
    icon: Layers,
    short: "Design",
    title: "Solution architecture",
    description:
      "Once a direction is established, we translate requirements into a structured technical approach. This can include application architecture, workflows, integrations, data models, infrastructure and the components required to bring everything together.",
  },
  {
    id: "implementation",
    icon: Workflow,
    short: "Build",
    title: "Implementation & evolution",
    description:
      "Where implementation is commissioned, we take an agreed solution into engineering and delivery. From developing applications and automating workflows to connecting existing systems, we focus on dependable technology that can be maintained and improved over time.",
  },
];

export function Outcomes() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="public-section home-outcomes"
      id="outcomes"
      aria-labelledby="outcomes-title"
    >
      <div className="outcomes-container">
        <div className="outcomes-introduction">
          <h2 id="outcomes-title">
            More than a
            <br />
            recommendation
            <span className="kailor-round-dot" aria-hidden="true" />
          </h2>

          <p>
            Good consultancy creates direction. Good engineering turns that
            direction into something useful. kailor brings both together, from
            understanding a challenge to delivering an appropriate solution.
          </p>
        </div>

        <div className="outcomes-diagram">
          {/* Thin connecting lines */}
          <motion.span
            className="outcomes-axis outcomes-axis--horizontal"
            aria-hidden="true"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    scaleX: 0,
                  }
            }
            whileInView={{
              opacity: 1,
              scaleX: 1,
            }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{
              duration: reducedMotion ? 0 : 1.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          <motion.span
            className="outcomes-axis outcomes-axis--vertical"
            aria-hidden="true"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    scaleY: 0,
                  }
            }
            whileInView={{
              opacity: 1,
              scaleY: 1,
            }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{
              duration: reducedMotion ? 0 : 1.2,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          {/* Central charcoal circle */}
          <motion.div
            className="outcomes-circle"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    scale: 0.9,
                  }
            }
            whileInView={{
              opacity: 1,
              scale: 1,
            }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{
              duration: reducedMotion ? 0 : 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="outcomes-circle-grid">
              {outcomes.map(({ id, icon: Icon, short }) => (
                <div className="outcomes-circle-item" key={id}>
                  <Icon size={27} strokeWidth={1.4} />
                  <span>{short}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Surrounding descriptions */}
          {outcomes.map((outcome, index) => (
            <motion.article
              key={outcome.id}
              className={`outcomes-item outcomes-item--${outcome.id}`}
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 25,
                    }
              }
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{
                duration: reducedMotion ? 0 : 0.8,
                delay: reducedMotion ? 0 : index * 0.09,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <h3>{outcome.title}</h3>
              <p>{outcome.description}</p>
            </motion.article>
          ))}
        </div>

        <p className="outcomes-closing">
          Every engagement is shaped by the situation, the requirements and the
          work that actually needs to be done.
        </p>
      </div>
    </section>
  );
}
