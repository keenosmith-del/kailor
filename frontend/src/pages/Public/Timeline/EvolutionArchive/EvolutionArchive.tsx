import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Search, FileText, PanelsTopLeft, FolderOpen } from "lucide-react";
import { TimelineReveal } from "../TimelineReveal";
import {
  archiveCapabilities,
  type TimelineDetailContent,
} from "../timelineData";
import "./EvolutionArchive.css";
const icons = [Search, FileText, PanelsTopLeft, FolderOpen];
function ArchivePreview({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { amount: 0.15 });
  const reduced = useReducedMotion();
  return (
    <motion.span
      ref={ref}
      className={className}
      initial={false}
      animate={{ opacity: reduced || visible ? 1 : 0 }}
      transition={{
        duration: reduced ? 0 : 0.4,
        delay: reduced || !visible ? 0 : 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.span>
  );
}

export function EvolutionArchive({
  onSelect,
}: {
  onSelect: (value: TimelineDetailContent) => void;
}) {
  return (
    <section
      className="timeline-section timeline-archive"
      aria-labelledby="timeline-archive-title"
    >
      <TimelineReveal>
        <h2 className="timeline-section-heading" id="timeline-archive-title">
          What we've built
        </h2>
        <p className="timeline-intro">
          Over time, the ideas behind kailor have become a connected set of
          tools and experiences, designed to make technology decisions clearer
          and the work that follows easier to manage.
        </p>
        <p className="timeline-caption timeline-archive-caption">
          Existing capabilities · Illustrative interface content
        </p>
      </TimelineReveal>
      <div className="timeline-archive-grid">
        {archiveCapabilities.map((capability, index) => {
          const Icon = icons[index];
          return (
            <TimelineReveal
              key={capability.id}
              className={`timeline-archive-position archive-${capability.id}`}
              settle={0.12 + index * 0.025}
            >
              <button
                type="button"
                className="timeline-archive-card"
                aria-label={`Explore ${capability.title}`}
                onClick={() => onSelect(capability)}
              >
                <span className="timeline-archive-card-label">
                  <Icon size={18} strokeWidth={1.3} aria-hidden="true" />
                  {capability.title}
                </span>
                {capability.id === "discovery" ? (
                  <ArchivePreview className="timeline-archive-discovery">
                    <span className="timeline-preview-question">
                      What deserves
                      <br />
                      attention?
                    </span>
                    <span className="timeline-preview-pills">
                      <span>Existing tools</span>
                      <span>Manual work</span>
                      <span>An early idea</span>
                    </span>
                    <span className="timeline-preview-note">
                      A starting point for understanding the work
                    </span>
                  </ArchivePreview>
                ) : capability.id === "analysis" ? (
                  <ArchivePreview className="timeline-archive-analysis">
                    <span className="timeline-preview-title">
                      A clearer picture
                    </span>
                    <span>What we know</span>
                    <span>What needs checking</span>
                    <span>Possible approaches</span>
                    <span className="timeline-preview-note">
                      Structured findings, saved for review
                    </span>
                  </ArchivePreview>
                ) : capability.id === "canvas" ? (
                  <ArchivePreview className="timeline-archive-canvas">
                    <span className="timeline-preview-note">
                      Proposed direction
                    </span>
                    <span className="timeline-preview-title">
                      Connect
                      <br />
                      existing tools
                    </span>
                    <span className="timeline-preview-status">
                      For consideration
                    </span>
                  </ArchivePreview>
                ) : (
                  <ArchivePreview className="timeline-archive-workspace">
                    <span className="timeline-preview-title">
                      One project,
                      <br />
                      its own context
                    </span>
                    <span className="timeline-workspace-tabs">
                      <span>Conversation</span>
                      <span>Sources</span>
                      <span>Reports</span>
                    </span>
                    <span className="timeline-workspace-request">
                      <img
                        src="/mascot-head.png"
                        width={30}
                        height={30}
                        alt=""
                      />
                      <span>
                        Consultancy request
                        <br />
                        <small>Selected solutions, ready for review</small>
                      </span>
                    </span>
                  </ArchivePreview>
                )}
                <span className="timeline-archive-card-footer">
                  {capability.label}
                </span>
              </button>
            </TimelineReveal>
          );
        })}
      </div>
    </section>
  );
}
