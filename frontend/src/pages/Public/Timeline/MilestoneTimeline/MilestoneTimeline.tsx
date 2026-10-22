import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  Code2,
  Building2,
  Search,
  BrainCircuit,
  PanelsTopLeft,
  FolderOpen,
  Monitor,
  Sprout,
} from "lucide-react";
import {
  milestones,
  type Milestone,
  type TimelineDetailContent,
} from "../timelineData";
import { TimelineReveal } from "../TimelineReveal";
import "./MilestoneTimeline.css";
const icons = {
  code: Code2,
  foundation: Building2,
  understanding: Search,
  discovery: BrainCircuit,
  canvas: PanelsTopLeft,
  workspace: FolderOpen,
  website: Monitor,
  present: Sprout,
};
function MilestoneItem({
  milestone,
  index,
  progress,
  onSelect,
}: {
  milestone: Milestone;
  index: number;
  progress: MotionValue<number>;
  onSelect: (value: TimelineDetailContent) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "end 65%"],
  });
  // Native CSS uses the appropriate line; cards use their own viewport progress
  // on both layouts, so every date stays readable once it has entered.
  const opacity = useTransform(
    scrollYProgress,
    [index * 0.015, 0.45 + index * 0.015],
    [0, 1],
  );
  const y = useTransform(scrollYProgress, [0, 0.7], [14, 0]);
  const connector = useTransform(
    progress,
    [index * 0.075, index * 0.075 + 0.1],
    [0, 1],
  );
  const Icon = icons[milestone.icon];
  return (
    <li
      ref={ref}
      className={`company-milestone ${index % 2 ? "is-below" : "is-above"}`}
      data-milestone={milestone.id}
    >
      <span className="company-milestone-marker" aria-hidden="true" />
      <motion.span
        className="company-milestone-connector"
        aria-hidden="true"
        style={{ opacity: reduced ? 1 : connector }}
      />
      <motion.article
        className="company-milestone-content"
        style={{ opacity: reduced ? 1 : opacity, y: reduced ? 0 : y }}
      >
        <button
          type="button"
          className="company-milestone-icon"
          aria-label={`Read about ${milestone.title}`}
          onClick={() => onSelect(milestone)}
        >
          <Icon size={18} strokeWidth={1.3} aria-hidden="true" />
        </button>
        <p className="company-milestone-date">{milestone.date}</p>
        <h3>{milestone.title}</h3>
        <p className="company-milestone-description">{milestone.description}</p>
      </motion.article>
    </li>
  );
}
export function MilestoneTimeline({
  onSelect,
}: {
  onSelect: (value: TimelineDetailContent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 35%"],
  });
  return (
    <section
      className="timeline-section timeline-chronology"
      aria-labelledby="timeline-chronology-title"
    >
      <TimelineReveal>
        <h2 className="timeline-section-heading" id="timeline-chronology-title">
          An idea, given shape
        </h2>
        <p className="timeline-intro">
          Experience, a considered approach and the tools to carry it forward.
          Explore a milestone for a closer look.
        </p>
      </TimelineReveal>
      <div ref={ref} className="company-milestones-scene">
        <div className="company-timeline-line" aria-hidden="true">
          <motion.span
            className="company-timeline-line-horizontal"
            style={{ scaleX: reduced ? 1 : scrollYProgress }}
          />
          <motion.span
            className="company-timeline-line-vertical"
            style={{ scaleY: reduced ? 1 : scrollYProgress }}
          />
        </div>
        <ol className="company-milestones">
          {milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              index={index}
              progress={scrollYProgress}
              onSelect={onSelect}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
