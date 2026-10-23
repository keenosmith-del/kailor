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
  useInView,
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
  {
    name: "Consultant messaging",
    status: "In progress",
    icon: MessagesSquare,
    dark: true,
  },
  { name: "Cloud foundations", status: "Engineering", icon: Cloud },
  {
    name: "Assessment reports",
    status: "Improving",
    icon: FileText,
    dark: true,
  },
];

function ActivityPill({
  development: { name, status, icon: Icon, dark },
  index,
}: {
  development: Development;
  index: number;
}) {
  // Observe a stationary grid slot. The latched entrance cannot be retriggered
  // by the parent's scroll transform or by hovering the separate inner surface.
  const ref = useRef<HTMLDivElement>(null);
  const entered = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  return (
    <div
      ref={ref}
      className={`home-activity__bubble-slot home-activity__bubble--${index + 1}`}
    >
      <motion.div
        className="home-activity__bubble-reveal"
        initial={reduced ? false : { opacity: 0, y: 35, scale: 0.94 }}
        animate={{
          opacity: reduced || entered ? 1 : 0,
          y: reduced || entered ? 0 : 35,
          scale: reduced || entered ? 1 : 0.94,
        }}
        transition={{
          duration: reduced ? 0 : 0.75,
          delay: reduced ? 0 : index * 0.095,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          className={`home-activity__bubble${dark ? " is-dark" : ""}`}
          whileHover={reduced ? undefined : { scale: 1.035, y: -4 }}
          transition={{
            duration: reduced ? 0 : 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Icon
            className="home-activity__icon"
            size={17}
            strokeWidth={1.7}
            aria-hidden="true"
          />
          <span className="home-activity__name">{name}</span>
          <span className="home-activity__status">{status}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

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
          <h2 id="activity-title">Always something in motion</h2>
          <p>
            New ideas, evolving tools and considered engineering. A glimpse of
            the work taking shape across kailor.
          </p>
        </div>

        <div
          className="home-activity__bubbles"
          aria-label="Areas of ongoing development"
        >
          {developments.map((development, index) => (
            <ActivityPill
              key={development.name}
              development={development}
              index={index}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
