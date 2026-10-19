import "./FeatureCarousel.css";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Layers, Route, Network } from "lucide-react";
import { Link } from "react-router";
const examples = [
  {
    title: "A calmer working day.",
    type: "Workflow concept",
    icon: Route,
    copy: "An enquiry-to-follow-up workflow that makes the next action visible.",
    detail:
      "Explore a shared enquiry record, clear ownership and reminders. Start by comparing existing tools; any messaging or calendar integration needs separate feasibility and permissions review.",
  },
  {
    title: "Knowledge, connected.",
    type: "AI-assisted concept",
    icon: Network,
    copy: "A considered way to organise information and find relevant context.",
    detail:
      "Explore an internal knowledge assistant with an agreed source set and human review. Access control, data handling and answer reliability must be tested before operational use.",
  },
  {
    title: "One useful workspace.",
    type: "Software concept",
    icon: Layers,
    copy: "A focused operational tool built around a specific requirement.",
    detail:
      "Explore a small web application that brings a defined workflow together. Agree users, essential records, reporting and operating responsibilities before committing to a build.",
  },
];
export function FeatureCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  function go(next: number) {
    const target = Math.max(0, Math.min(examples.length - 1, next));
    setIndex(target);
    ref.current?.children[target]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "nearest",
      inline: "start",
    });
  }
  return (
    <div className="feature-carousel">
      <div className="carousel-heading">
        <p>Demonstration scenarios · not client case studies</p>
        <div className="actions">
          <button
            className="pub-icon"
            aria-label="Previous solution"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            <ArrowLeft size={19} />
          </button>
          <button
            className="pub-icon"
            aria-label="Next solution"
            disabled={index === examples.length - 1}
            onClick={() => go(index + 1)}
          >
            <ArrowRight size={19} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="feature-track"
        tabIndex={0}
        role="region"
        aria-label="Solution concepts"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(index + 1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(index - 1);
          }
        }}
        onScroll={() => {
          const el = ref.current;
          if (el) {
            const item = el.children[0] as HTMLElement;
            setIndex(
              Math.min(2, Math.round(el.scrollLeft / (item.offsetWidth + 24))),
            );
          }
        }}
      >
        {examples.map((item, i) => {
          const Icon = item.icon;
          return (
            <article className="feature-slide" key={item.title}>
              <div className="feature-slide-art">
                <Icon size={36} strokeWidth={1} />
              </div>
              <div className="feature-slide-copy">
                <span>{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <details>
                  <summary>Explore the idea</summary>
                  <p>{item.detail}</p>
                  <Link className="pub-pill" to="/contact">
                    Discuss something similar <ArrowRight size={16} />
                  </Link>
                </details>
              </div>
            </article>
          );
        })}
      </div>
      <p className="carousel-position" aria-live="polite">
        {index + 1} / {examples.length}
      </p>
    </div>
  );
}
