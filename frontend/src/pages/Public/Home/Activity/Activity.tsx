import { useRef } from "react";
import {
  BrainCircuit,
  Cloud,
  FileText,
  Layers3,
  MessagesSquare,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import "./Activity.css";

type Development = {
  name: string;
  status: string;
  icon: LucideIcon;
  dark?: boolean;
};

const developments: Development[] = [
  { name: "AI-assisted discovery", status: "Evolving", icon: BrainCircuit },
  { name: "Project workspaces", status: "Building", icon: Layers3, dark: true },
  { name: "Solution canvas", status: "Refining", icon: Workflow },
  { name: "Consultant messaging", status: "In progress", icon: MessagesSquare, dark: true },
  { name: "Cloud foundations", status: "Engineering", icon: Cloud },
  { name: "Assessment reports", status: "Improving", icon: FileText, dark: true },
];

export function Activity() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.13, 0.87, 1],
    [0, 1, 1, 0],
  );

  const translateY = useTransform(
    scrollYProgress,
    [0, 0.13, 0.87, 1],
    [26, 0, 0, -26],
  );

  return (
    <section
      ref={sectionRef}
      className="public-section home-activity"
      id="activity"
      aria-labelledby="activity-title"
    >
      <motion.div
        className="home-activity__inner"
        style={{
          opacity: reducedMotion ? 1 : opacity,
          y: reducedMotion ? 0 : translateY,
        }}
      >
        <div className="home-activity__intro">
          <h2 id="activity-title">
            Always something in motion
            <span className="home-activity__dot" aria-hidden="true" />
          </h2>
          <p>
            New ideas, evolving tools and considered engineering. A glimpse of
            the work taking shape across kailor.
          </p>
        </div>

        <div className="home-activity__bubbles" aria-label="Areas of ongoing development">
          {developments.map(({ name, status, icon: Icon, dark }, index) => (
            <motion.div
              key={name}
              className={`home-activity__bubble home-activity__bubble--${index + 1}${dark ? " is-dark" : ""}`}
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 35, scale: 0.94 }
              }
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={
                reducedMotion ? undefined : { scale: 1.035, y: -4 }
              }
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: reducedMotion ? 0 : 0.75,
                delay: reducedMotion ? 0 : index * 0.095,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Icon className="home-activity__icon" size={17} strokeWidth={1.7} aria-hidden="true" />
              <span className="home-activity__name">{name}</span>
              <span className="home-activity__status">{status}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
