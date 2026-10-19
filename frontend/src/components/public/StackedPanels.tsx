import { useRef } from "react";
import { Link } from "react-router";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { services } from "../../pages/Public/content";
import { Sculpture, ArrowLink } from "./Visuals";
function Panel({
  index,
  progress,
}: {
  index: number;
  progress: MotionValue<number>;
}) {
  const s = services[index],
    Icon = s.icon;
  const reduced = useReducedMotion();
  const scale = useTransform(
    progress,
    [index / 6, (index + 1.8) / 6],
    [1, 0.94],
  );
  return (
    <article
      className="service-panel"
      style={{ top: `${104 + index * 15}px`, zIndex: index + 1 }}
    >
      <motion.div
        className="service-panel-inner"
        style={{ scale: reduced ? 1 : scale }}
      >
        <div className="service-panel-copy">
          <h3>
            {s.title}
            <br />
            <span>{s.second}</span>
          </h3>
          <p>{s.summary}</p>
          <div className="service-tags">
            {s.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <Link className="pub-pill pub-pill-outline" to={`/services#${s.id}`}>
            Explore{" "}
            {index === 1
              ? "AI"
              : index === 3
                ? "cloud"
                : index === 4
                  ? "consulting"
                  : s.title.toLowerCase()}{" "}
            <ArrowLink />
          </Link>
        </div>
        <div className="service-art">
          <Sculpture kind={index + 1} />
          <span className="service-art-label">
            <Icon size={18} strokeWidth={1.4} />
            {s.tags[0]}
          </span>
        </div>
      </motion.div>
    </article>
  );
}
export function StackedPanels() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  return (
    <div ref={ref} className="stacked-panels">
      {services.map((s, i) => (
        <Panel key={s.id} index={i} progress={scrollYProgress} />
      ))}
    </div>
  );
}
