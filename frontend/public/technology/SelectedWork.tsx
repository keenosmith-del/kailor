import { useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./SelectedWork.css";

type Project = {
  name: string;
  category: string;
  headline: string;
  description: string;
  scope: string;
  kind: "Illustrative concept" | "Independent engineering project";
  visual: "workflow" | "delivery" | "retail" | "inspection";
  portrait?: string;
  repository?: string;
};

const projects: Project[] = [
  {
    name: "Avenor",
    category: "AI & business automation",
    headline: "A more connected way to work.",
    description:
      "An illustrative operational workspace bringing enquiries, appointment scheduling, tasks and follow-ups together, with AI assistance supporting the people behind the process.",
    scope: "Workflow engineering · AI assistance · Business systems",
    kind: "Illustrative concept",
    visual: "workflow",
    portrait: "/clients/17.jpeg",
  },
  {
    name: "Northline",
    category: "Software & cloud engineering",
    headline: "A clearer view of every delivery.",
    description:
      "A logistics platform concept connecting dispatch, drivers and delivery operations in one clear workspace, with route progress, exceptions and supporting cloud services.",
    scope: "Full-stack engineering · Cloud architecture · Integrations",
    kind: "Illustrative concept",
    visual: "delivery",
    portrait: "/clients/18.jpeg",
  },
  {
    name: "Morrow",
    category: "Commerce & business intelligence",
    headline: "Making complex retail decisions simpler.",
    description:
      "A retail intelligence concept that connects inventory, purchasing and transaction information to help teams understand demand and coordinate stock decisions across locations.",
    scope: "Data engineering · Analytics · Intelligent forecasting",
    kind: "Illustrative concept",
    visual: "retail",
    portrait: "/clients/19.jpeg",
  },
  {
    name: "Intelligent Manufacturing QC",
    category: "Machine learning & full-stack engineering",
    headline: "A closer look at quality, with people in control.",
    description:
      "An independent working visual-inspection application for six known steel surface-defect patterns. It combines model training, ONNX inference in a Rust API, inspection history, human review and versioned model releases. The project does not claim production-grade inspection performance.",
    scope: "React · Rust · TensorFlow · ONNX Runtime · MLOps",
    kind: "Independent engineering project",
    visual: "inspection",
    repository: "https://github.com/keenosmith-del/intelligent-manufacturing-qc",
  },
];

const transition = {
  duration: 0.82,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

function ProjectVisual({ type }: { type: Project["visual"] }) {
  if (type === "workflow") {
    return (
      <div className="selected-work__visual selected-work__visual--workflow" aria-hidden="true">
        <div className="sw-window__top"><span className="sw-window__dot" /> Client operations <span>Concept preview</span></div>
        <div className="sw-workflow-row"><span>New enquiry</span><i /><b>Received</b></div>
        <div className="sw-workflow-row sw-workflow-row--second"><span>Appointment request</span><i /><b>In progress</b></div>
        <div className="sw-workflow-row sw-workflow-row--third"><span>Team follow-up</span><i /><b>Review</b></div>
        <div className="sw-float-note"><span className="sw-float-note__mark" /> A more connected process</div>
      </div>
    );
  }

  if (type === "delivery") {
    return (
      <div className="selected-work__visual selected-work__visual--delivery" aria-hidden="true">
        <div className="sw-window__top"><span className="sw-window__dot" /> Dispatch overview <span>Route activity</span></div>
        <svg className="sw-route-map" viewBox="0 0 380 200" fill="none" preserveAspectRatio="xMidYMid meet">
          <path className="sw-route-map__grid" d="M0 35H380M0 80H380M0 125H380M0 170H380M48 0V200M117 0V200M195 0V200M272 0V200M346 0V200" />
          <path className="sw-route-map__base" d="M34 160 C95 160, 90 60, 156 83 S252 166, 340 44" />
          <path className="sw-route-map__active" d="M34 160 C95 160, 90 60, 156 83 S252 166, 340 44" />
          <circle cx="34" cy="160" r="7" className="sw-route-map__point" />
          <circle cx="340" cy="44" r="7" className="sw-route-map__point" />
        </svg>
        <div className="sw-delivery-caption"><span className="sw-status-dot" /> Dispatch and delivery activity</div>
      </div>
    );
  }

  if (type === "retail") {
    return (
      <div className="selected-work__visual selected-work__visual--retail" aria-hidden="true">
        <div className="sw-window__top"><span className="sw-window__dot" /> Demand overview <span>Illustrative</span></div>
        <div className="sw-retail-title">Patterns worth seeing.</div>
        <div className="sw-chart" aria-hidden="true">
          {[43, 64, 51, 78, 57, 91, 70, 84, 62].map((height, index) => (
            <span key={index} style={{ "--bar-height": `${height}%`, "--bar-delay": `${index * 90}ms` } as CSSProperties} />
          ))}
        </div>
        <div className="sw-retail-foot"><span>Inventory</span><span>Purchasing</span><span>Demand</span></div>
      </div>
    );
  }

  return (
    <div className="selected-work__visual selected-work__visual--inspection" aria-hidden="true">
      <div className="sw-window__top"><span className="sw-window__dot" /> Visual inspection <span>Human review</span></div>
      <div className="sw-steel-sample"><span className="sw-steel-sample__scan" /><span className="sw-steel-sample__mark" /></div>
      <div className="sw-inspection-foot"><span>Inspection evidence</span><strong>Review queue</strong></div>
    </div>
  );
}

function ProjectSlide({
  project,
  active,
  reducedMotion,
}: {
  project: Project;
  active: boolean;
  reducedMotion: boolean | null;
}) {
  return (
    <article
      className={`selected-work__slide${active ? " is-active" : ""}`}
      role="group"
      aria-roledescription="slide"
      aria-label={`${project.name}, ${project.kind}`}
    >
      <div className={`selected-work__artwork selected-work__artwork--${project.visual}`}>
        <ProjectVisual type={project.visual} />

        <img
          className="selected-work__mascot"
          src="/mascot/other/kailor-sitting-arms-folded.png"
          alt=""
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />

        <div className="selected-work__artwork-overlay">
          <div className="selected-work__portrait" aria-hidden="true">
            {project.portrait ? (
              <img src={project.portrait} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="selected-work__portrait-symbol">k</span>
            )}
          </div>
          <span className="selected-work__artwork-name">{project.name}</span>
          <small>{project.kind}</small>
        </div>
      </div>

      <div className="selected-work__information">
        <span className="selected-work__category">{project.category}</span>

        <motion.div
          className="selected-work__information-main"
          initial={false}
          animate={reducedMotion || active ? { opacity: 1, y: 0 } : { opacity: 0.72, y: 9 }}
          transition={transition}
        >
          <h3>{project.headline}</h3>
          <p>{project.description}</p>
        </motion.div>

        <div className="selected-work__scope">
          <span>Focus areas</span>
          <p>{project.scope}</p>
          {project.repository && (
            <a
              href={project.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="selected-work__project-link"
              aria-label={`Explore ${project.name} source repository (opens in a new tab)`}
            >
              Explore the engineering <ExternalLink size={14} strokeWidth={1.6} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function SelectedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const scrollOpacity = useTransform(
    scrollYProgress,
    [0, 0.13, 0.85, 1],
    [0, 1, 1, 0],
  );

  const scrollY = useTransform(
    scrollYProgress,
    [0, 0.13, 0.85, 1],
    [26, 0, 0, -26],
  );

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(projects.length - 1, index));
    const track = trackRef.current;
    const slide = track?.children[next] as HTMLElement | undefined;

    if (track && slide) {
      const trackRect = track.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();
      const left =
        track.scrollLeft +
        slideRect.left - trackRect.left -
        (trackRect.width - slideRect.width) / 2;

      track.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
    }

    setActiveIndex(next);
  };

  const updateActiveSlide = () => {
    const track = trackRef.current;
    if (!track) return;

    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    Array.from(track.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex((current) => current === nearestIndex ? current : nearestIndex);
  };

  return (
    <motion.section
      ref={sectionRef}
      className="public-section home-work"
      id="work"
      aria-labelledby="selected-work-title"
      style={{ opacity: reducedMotion ? 1 : scrollOpacity, y: reducedMotion ? 0 : scrollY }}
    >
      <div className="selected-work">
        <motion.header
          className="selected-work__heading"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={transition}
        >
          <h2 id="selected-work-title">
            What we've built<span className="kailor-round-dot" aria-hidden="true" />
          </h2>
          <p>
            Different challenges, different approaches. A closer look at the
            thinking behind considered digital solutions.
          </p>
        </motion.header>

        <motion.div
          className="selected-work__carousel"
          initial={reducedMotion ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ ...transition, delay: reducedMotion ? 0 : 0.12 }}
        >
          <div
            ref={trackRef}
            className="selected-work__track"
            role="region"
            aria-roledescription="carousel"
            aria-label="Selected projects"
            tabIndex={0}
            onScroll={updateActiveSlide}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                goTo(activeIndex - 1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                goTo(activeIndex + 1);
              }
            }}
          >
            {projects.map((project, index) => (
              <ProjectSlide
                key={project.name}
                project={project}
                active={activeIndex === index}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>

          <div className="selected-work__navigation">
            <button
              type="button"
              className="selected-work__nav-button"
              aria-label="Previous project"
              disabled={activeIndex === 0}
              onClick={() => goTo(activeIndex - 1)}
            >
              <ChevronLeft size={19} strokeWidth={1.6} />
            </button>

            <div className="selected-work__indicators" role="group" aria-label="Choose project">
              {projects.map((project, index) => (
                <button
                  key={project.name}
                  type="button"
                  className={`selected-work__indicator${activeIndex === index ? " is-active" : ""}`}
                  aria-label={`Show ${project.name}`}
                  aria-current={activeIndex === index ? "true" : undefined}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>

            <button
              type="button"
              className="selected-work__nav-button"
              aria-label="Next project"
              disabled={activeIndex === projects.length - 1}
              onClick={() => goTo(activeIndex + 1)}
            >
              <ChevronRight size={19} strokeWidth={1.6} />
            </button>
          </div>
        </motion.div>

        <p className="selected-work__sr-only" aria-live="polite">
          Showing {projects[activeIndex].name}
        </p>
      </div>
    </motion.section>
  );
}
