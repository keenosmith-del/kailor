import { useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { useConversation } from "../../../../components/public/ConversationModal/ConversationModal";
import "./SelectedWork.css";

type Project = {
  name: string;
  tileName?: string;
  category: string;
  kind: string;
  headline: string;
  description: string;
  tileDescription: string;
  scope: string;
  scopePdf: string;
  avatar: string;
};

const projects: Project[] = [
  {
    name: "Avenor",
    category: "AI & business automation",
    kind: "Illustrative project concept",
    headline: "A more connected way to work.",
    description:
      "A unified operational environment for a professional services business. Customer enquiries, appointment scheduling, task allocation and follow-ups are brought into one connected workflow, with intelligent assistance supporting the people behind it.",
    tileDescription: "Everyday operations, brought together.",
    scope: "Workflow engineering · AI assistance · Business systems",
    scopePdf: "/documents/selected-work/avenor-scope.pdf",
    avatar: "/clients/17.jpeg",
  },
  {
    name: "Northline",
    category: "Software & cloud engineering",
    kind: "Illustrative project concept",
    headline: "A clearer view of every delivery.",
    description:
      "A logistics management platform connecting dispatch teams, drivers and day-to-day operations. Delivery scheduling, fleet activity, route progress and exceptions are considered within a central workspace supported by connected services and cloud infrastructure.",
    tileDescription: "Dispatch, drivers and deliveries in sync.",
    scope: "Full-stack engineering · Cloud architecture · Integrations",
    scopePdf: "/documents/selected-work/northline-scope.pdf",
    avatar: "/clients/18.jpeg",
  },
  {
    name: "Morrow",
    category: "Commerce & business intelligence",
    kind: "Illustrative project concept",
    headline: "Making complex retail decisions simpler.",
    description:
      "A connected intelligence concept for a multi-location retailer. Inventory, purchasing activity and transaction information are brought together to help teams understand demand, anticipate stock requirements and make better-informed decisions across locations.",
    tileDescription: "A clearer picture of what comes next.",
    scope: "Data engineering · Analytics · Intelligent forecasting",
    scopePdf: "/documents/selected-work/morrow-scope.pdf",
    avatar: "/clients/19.jpeg",
  },
  {
    name: "Manufacturing QC",
    tileName: "Manufacturing\nQC",
    category: "Machine learning & software engineering",
    kind: "Independent engineering project",
    headline: "Visual inspection with accountable decisions.",
    description:
      "An implemented inspection and model-lifecycle application for known steel-surface defect patterns. A React workspace, Rust inference API, TensorFlow training and ONNX Runtime are combined with traceable human review, model evaluation and rollback workflows.",
    tileDescription: "Machine learning with human review.",
    scope: "React · Rust · TensorFlow · ONNX Runtime · MLOps",
    scopePdf: "/documents/selected-work/manufacturing-qc-scope.pdf",
    avatar: "/clients/20.jpeg",
  },
];

const easing = [0.22, 1, 0.36, 1] as const;

export function SelectedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { openConversation } = useConversation();
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // The entire section fades in and out as it enters and leaves the viewport.
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.13, 0.84, 1],
    [0, 1, 1, 0],
  );
  const y = useTransform(scrollYProgress, [0, 0.16, 0.84, 1], [26, 0, 0, -22]);

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(projects.length - 1, index));
    const track = trackRef.current;
    const slide = track?.children[next] as HTMLElement | undefined;

    if (!track || !slide) return;

    // Scroll the carousel itself, never the entire page.
    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const left =
      track.scrollLeft +
      (slideRect.left - trackRect.left) -
      (trackRect.width - slideRect.width) / 2;

    track.scrollTo({
      left,
      behavior: reducedMotion ? "auto" : "smooth",
    });

    setActiveIndex(next);
  };

  const updateActiveSlide = () => {
    const track = trackRef.current;
    if (!track) return;

    const bounds = track.getBoundingClientRect();
    const centre = bounds.left + bounds.width / 2;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(track.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - centre);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex((current) =>
      current === nearestIndex ? current : nearestIndex,
    );
  };

  return (
    <motion.section
      ref={sectionRef}
      className="public-section home-work"
      id="work"
      aria-labelledby="selected-work-title"
      style={{
        opacity: reducedMotion ? 1 : opacity,
        y: reducedMotion ? 0 : y,
      }}
    >
      <div className="selected-work">
        <motion.header
          className="selected-work__heading"
          initial={reducedMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: reducedMotion ? 0 : 0.85, ease: easing }}
        >
          <h2 id="selected-work-title">
            Selected work
            <span className="kailor-round-dot" aria-hidden="true" />
          </h2>
          <p>
            Different kinds of challenges. Each approached with its own
            thinking, requirements and technical decisions.
          </p>
        </motion.header>

        <div className="selected-work__carousel">
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
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                goTo(activeIndex + 1);
              }
            }}
          >
            {projects.map((project, index) => (
              <motion.article
                key={project.name}
                className="selected-work__slide"
                role="group"
                aria-roledescription="slide"
                aria-label={project.name}
                initial={
                  reducedMotion ? false : { opacity: 0, y: 38, scale: 0.985 }
                }
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.28 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.9,
                  delay: reducedMotion ? 0 : index === 0 ? 0.08 : 0,
                  ease: easing,
                }}
              >
                <div className="selected-work__tile">
                  <span
                    className={`selected-work__tile-name${
                      project.tileName ? " selected-work__tile-name--long" : ""
                    }`}
                    aria-hidden="true"
                  >
                    {project.tileName ?? project.name}
                  </span>

                  <div className="selected-work__tile-identity">
                    <img
                      className="selected-work__client-avatar"
                      src={project.avatar}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="selected-work__tile-project">
                      {project.name}
                    </span>
                    <p>{project.tileDescription}</p>
                  </div>
                </div>

                <div className="selected-work__details">
                  <div className="selected-work__details-top">
                    <span className="selected-work__category">
                      {project.category}
                    </span>
                    <span className="selected-work__kind">{project.kind}</span>
                  </div>

                  <div className="selected-work__details-main">
                    <h3>{project.name}</h3>
                    <p className="selected-work__headline">
                      {project.headline}
                    </p>
                    <p className="selected-work__description">
                      {project.description}
                    </p>
                  </div>

                  <div className="selected-work__scope">
                    <p>{project.scope}</p>
                    <a
                      href={project.scopePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${project.name} project scope PDF in a new tab`}
                    >
                      View project scope
                      <ExternalLink
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </a>
                  </div>
                </div>
              </motion.article>
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
              <ChevronLeft size={19} strokeWidth={1.6} aria-hidden="true" />
            </button>

            <div
              className="selected-work__indicators"
              role="group"
              aria-label="Choose project"
            >
              {projects.map((project, index) => (
                <button
                  key={project.name}
                  type="button"
                  className={`selected-work__indicator${
                    activeIndex === index ? " is-active" : ""
                  }`}
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
              <ChevronRight size={19} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>
        </div>

        <p
          className="selected-work__sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          Showing {projects[activeIndex].name}
        </p>

        <motion.div
          className="selected-work__actions"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, ease: easing }}
        >
          <Link
            className="pub-pill header-sign-in selected-work__cta selected-work__cta--outline"
            to="/work"
          >
            Explore all projects
          </Link>
          <button
            type="button"
            className="selected-work__cta selected-work__cta--primary"
            onClick={openConversation}
          >
            Start a project
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
}
