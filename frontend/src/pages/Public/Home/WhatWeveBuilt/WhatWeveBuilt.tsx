import { CapabilityDetail } from "./CapabilityDetail";
import { useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Search, FileText, PanelsTopLeft, FolderOpen } from "lucide-react";
import { CapabilityReveal } from "./CapabilityReveal";
import { capabilities, type CapabilityDetailContent } from "./capabilities";
import "./WhatWeveBuilt.css";
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

export function CapabilityGallery({
  onSelect,
  id = "what-weve-built",
}: {
  onSelect: (value: CapabilityDetailContent) => void;
  id?: string;
}) {
  return (
    <section
      className="what-weve-built"
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <CapabilityReveal>
        <h2 className="built-heading" id={`${id}-title`}>
          Designed to evolve with you
        </h2>
        <p className="built-intro">
          The way forward is not always straightforward. No two projects are quite the same. Priorities shift, requirements
          change and new possibilities emerge along the way. kailor is designed
          with that flexibility in mind, allowing different needs and approaches
          to shape the experience rather than forcing everything into a fixed
          process.
        </p>
        <p className="built-caption built-archive-caption">
          Existing capabilities · Illustrative interface content
        </p>
      </CapabilityReveal>
      <div className="built-archive-grid">
        {capabilities.map((capability, index) => {
          const Icon = icons[index];
          return (
            <CapabilityReveal
              key={capability.id}
              className={`built-archive-position built-position-${capability.id}`}
              settle={0.12 + index * 0.025}
            >
              <button
                type="button"
                className="built-archive-card"
                aria-label={`Explore ${capability.title}`}
                onClick={() => onSelect(capability)}
              >
                <span className="built-archive-card-label">
                  <Icon size={18} strokeWidth={1.3} aria-hidden="true" />
                  {capability.title}
                </span>
                {capability.id === "discovery" ? (
                  <ArchivePreview className="built-archive-discovery">
                    <span className="built-preview-question">
                      What deserves
                      <br />
                      attention?
                    </span>
                    <span className="built-preview-pills">
                      <span>Existing tools</span>
                      <span>Manual work</span>
                      <span>An early idea</span>
                    </span>
                    <span className="built-preview-note">
                      A starting point for understanding the work
                    </span>
                  </ArchivePreview>
                ) : capability.id === "analysis" ? (
                  <ArchivePreview className="built-archive-analysis">
                    <span className="built-preview-title">
                      A clearer picture
                    </span>
                    <span>What we know</span>
                    <span>What needs checking</span>
                    <span>Possible approaches</span>
                    <span className="built-preview-note">
                      Structured findings, saved for review
                    </span>
                  </ArchivePreview>
                ) : capability.id === "canvas" ? (
                  <ArchivePreview className="built-archive-canvas">
                    <span className="built-preview-note">
                      Proposed direction
                    </span>
                    <span className="built-preview-title">
                      Connect
                      <br />
                      existing tools
                    </span>
                    <span className="built-preview-status">
                      For consideration
                    </span>
                  </ArchivePreview>
                ) : (
                  <ArchivePreview className="built-archive-workspace">
                    <span className="built-preview-title">
                      One project,
                      <br />
                      its own context
                    </span>
                    <span className="built-workspace-tabs">
                      <span>Conversation</span>
                      <span>Sources</span>
                      <span>Reports</span>
                    </span>
                    <span className="built-workspace-request">
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
                <span className="built-archive-card-footer">
                  {capability.label}
                </span>
              </button>
            </CapabilityReveal>
          );
        })}
      </div>
    </section>
  );
}

export function WhatWeveBuilt() {
  const [selected, setSelected] = useState<CapabilityDetailContent | null>(
    null,
  );
  return (
    <>
      <CapabilityGallery onSelect={setSelected} />
      {selected && (
        <CapabilityDetail
          content={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
