import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  artwork?: string;
};

const projects: Project[] = [
  {
    name: "Avenor",
    category: "AI & business automation",
    headline: "A more connected way to work.",
    description:
      "A unified operational environment for a growing professional services business. Customer enquiries, appointment scheduling, task allocation and follow-ups are brought into one connected workflow, with intelligent assistance supporting the team behind the scenes.",
    scope: "Workflow engineering · AI assistance · Business systems",
    artwork: "",
  },
  {
    name: "Northline",
    category: "Software & cloud engineering",
    headline: "A clearer view of every delivery.",
    description:
      "A logistics management platform designed to connect dispatch teams, drivers and everyday operations. Delivery scheduling, fleet activity, route progress and exceptions can be managed through a central workspace, supported by connected services and cloud infrastructure.",
    scope: "Full-stack engineering · Cloud architecture · Integrations",
    artwork: "",
  },
  {
    name: "Morrow",
    category: "Commerce & business intelligence",
    headline: "Making complex retail decisions simpler.",
    description:
      "A connected intelligence platform for a multi-location retail business. Inventory, purchasing activity and transaction information are brought together to help teams understand demand, anticipate stock requirements and coordinate decisions across locations.",
    scope: "Data engineering · Analytics · Intelligent forecasting",
    artwork: "",
  },
];

export function SelectedWork() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(projects.length - 1, index));

    const track = trackRef.current;
    const slide = track?.children[next] as HTMLElement | undefined;

    slide?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveIndex(next);
  };

  const updateActiveSlide = () => {
    const track = trackRef.current;
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const centre = trackRect.left + trackRect.width / 2;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(track.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const childCentre = rect.left + rect.width / 2;
      const distance = Math.abs(childCentre - centre);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex((current) =>
      current === nearestIndex ? current : nearestIndex,
    );
  };

  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const scrollOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.78, 1],
    [0, 1, 1, 0],
  );

  const scrollY = useTransform(
    scrollYProgress,
    [0, 0.18, 0.78, 1],
    [35, 0, 0, -35],
  );

  return (
    <motion.section
      ref={sectionRef}
      className="public-section home-work"
      id="work"
      aria-labelledby="selected-work-title"
      style={{
        opacity: reducedMotion ? 1 : scrollOpacity,
        y: reducedMotion ? 0 : scrollY,
      }}
    >
      <motion.div
        className="selected-work"
        initial={reducedMotion ? false : { opacity: 0, y: 35 }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.08,
        }}
        transition={{
          duration: 1.1,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <header className="selected-work__heading">
          <h2 id="selected-work-title">
            What we've built
            <span className="kailor-round-dot" aria-hidden="true" />
          </h2>

          <p>
            Different challenges. Considered solutions. Technology built around
            what matters.
          </p>
        </header>

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
              }

              if (event.key === "ArrowRight") {
                event.preventDefault();
                goTo(activeIndex + 1);
              }
            }}
          >
            {projects.map((project) => (
              <article
                className="selected-work__slide"
                key={project.name}
                role="group"
                aria-roledescription="slide"
                aria-label={project.name}
              >
                <div className="selected-work__artwork">
                  {project.artwork ? (
                    <img
                      src={project.artwork}
                      alt={`${project.name} project artwork`}
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="selected-work__artwork-wordmark"
                      aria-hidden="true"
                    >
                      {project.name}
                    </span>
                  )}

                  <div className="selected-work__artwork-overlay">
                    <span>{project.name}</span>
                    <small>{project.category}</small>
                  </div>
                </div>

                <div className="selected-work__information">
                  <div className="selected-work__information-top">
                    <span className="selected-work__category">
                      {project.category}
                    </span>
                  </div>

                  <div className="selected-work__information-main">
                    <h3>{project.headline}</h3>
                    <p>{project.description}</p>
                  </div>

                  <div className="selected-work__scope">
                    <span>Scope of work</span>
                    <p>{project.scope}</p>
                  </div>
                </div>
              </article>
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
              <ChevronRight size={19} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <p className="selected-work__sr-only" aria-live="polite">
          Showing {projects[activeIndex].name}
        </p>

        <button
          type="button"
          className="selected-work__cta"
          disabled
          title="The full projects page is coming soon"
        >
          Explore all projects
        </button>
      </motion.div>
    </motion.section>
  );
}
