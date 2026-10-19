import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import {
  ArrowUpRight,
  Search,
  ScanLine,
  ChartNoAxesCombined,
  ListChecks,
  Hammer,
} from "lucide-react";
import { steps } from "../../pages/Public/content";
export function Sculpture({ kind = 0 }: { kind?: number }) {
  return (
    <div className={`sculpture sculpture-${kind}`} aria-hidden="true">
      <div className="sculpture-core" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <span className="orbit-dot" />
    </div>
  );
}
export function ProcessTimeline({ full = false }: { full?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 45%"],
  });
  const icons = [Search, ScanLine, ChartNoAxesCombined, ListChecks, Hammer];
  return (
    <div ref={ref} className={`process-timeline ${full ? "process-full" : ""}`}>
      <div className="process-track">
        <motion.div style={{ scaleX: reduced ? 1 : scrollYProgress }} />
      </div>
      {steps.map(([title, text], i) => {
        const Icon = icons[i];
        return (
          <div className="process-step" key={title}>
            <span className="process-node">
              <Icon size={21} strokeWidth={1.3} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        );
      })}
    </div>
  );
}
export function InsightGraph() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "end 40%"],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0.05, 1]);
  return (
    <div ref={ref}>
      <svg
        className="insight-graph"
        viewBox="0 0 1000 430"
        role="img"
        aria-labelledby="graph-title graph-desc"
      >
        <title id="graph-title">
          From uncertainty to a considered next step
        </title>
        <desc id="graph-desc">
          Illustrative process, not performance data. Discovery, context,
          options, direction and next step are represented by a dimensional
          rising line.
        </desc>
        <defs>
          <linearGradient id="graph-depth" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#353a3e" stopOpacity=".45" />
            <stop offset="1" stopColor="#e0e0e0" stopOpacity="0" />
          </linearGradient>
          <filter id="graph-shadow">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <path
          d="M55 330 L240 300 L360 320 L515 215 L650 235 L795 130 L935 75 L935 265 L795 300 L650 340 L515 330 L360 385 L240 365 L55 390Z"
          fill="url(#graph-depth)"
        />
        <path
          d="M55 360L240 330L360 350L515 245L650 265L795 160L935 105"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="10"
          opacity=".13"
          filter="url(#graph-shadow)"
        />
        <path
          d="M55 330L55 345L240 315L360 335L515 230L650 250L795 145L935 90L935 75L795 130L650 235L515 215L360 320L240 300Z"
          fill="#353a3e"
        />
        <motion.path
          d="M55 330L240 300L360 320L515 215L650 235L795 130L935 75"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="3"
          style={{ pathLength: reduced ? 1 : pathLength }}
        />
        {[
          [55, 330, "Discovery"],
          [240, 300, "Context"],
          [515, 215, "Options"],
          [795, 130, "Direction"],
          [935, 75, "Next step"],
        ].map(([x, y, label]) => (
          <g key={label}>
            <circle cx={x} cy={y} r="5" fill="#1a1a1a" />
            <text
              x={x}
              y={Number(y) - 24}
              textAnchor={
                label === "Discovery"
                  ? "start"
                  : label === "Next step"
                    ? "end"
                    : "middle"
              }
            >
              {label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
export function ArrowLink() {
  return <ArrowUpRight size={18} strokeWidth={1.5} />;
}
