import { useRef } from "react";
import { motion, useScroll, useReducedMotion } from "motion/react";
import {
  Search,
  ScanLine,
  ChartNoAxesCombined,
  ListChecks,
  Hammer,
} from "lucide-react";
import { steps } from "../../../pages/Public/content";
import "./ProcessTimeline.css";
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
