import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./ClientFeedback.css";

type Feedback = {
  name: string;
  initials: string;
  role: string;
  portrait: string;
  opening: string;
  highlight: string;
  ending: string;
};

const feedback: Feedback[] = [
  {
    name: "Nadia Jacobs",
    initials: "NJ",
    role: "Operations Director",
    portrait: "",
    opening: "We had plenty of ideas, but ",
    highlight: "no clear way to connect the pieces.",
    ending:
      " The process brought structure to our thinking and helped us understand what actually needed to change.",
  },
  {
    name: "Thabo Mokoena",
    initials: "TM",
    role: "Business Founder",
    portrait: "",
    opening:
      "What stood out was the attention given to understanding our business. ",
    highlight: "We weren't pushed towards technology we didn't need.",
    ending: " Every recommendation had a purpose.",
  },
  {
    name: "Leah Petersen",
    initials: "LP",
    role: "Project Lead",
    portrait: "",
    opening: "Our systems had grown in different directions. ",
    highlight: "kailor helped us see the bigger picture",
    ending: " and gave us a more considered way to approach the next phase.",
  },
];

export function ClientFeedback() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.16, 0.8, 1],
    [0, 1, 1, 0],
  );

  const y = useTransform(scrollYProgress, [0, 0.16, 0.8, 1], [30, 0, 0, -30]);

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(feedback.length - 1, index));

    const track = trackRef.current;
    const card = track?.children[next] as HTMLElement | undefined;

    if (track && card) {
      const cardLeft =
        card.getBoundingClientRect().left -
        track.getBoundingClientRect().left +
        track.scrollLeft;

      track.scrollTo({
        left: cardLeft,
        behavior: reducedMotion ? "instant" : "smooth",
      });
    }

    setActiveIndex(next);
  };

  const updateActive = () => {
    const track = trackRef.current;
    if (!track) return;

    const trackLeft = track.getBoundingClientRect().left;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;

    Array.from(track.children).forEach((child, index) => {
      const currentDistance = Math.abs(
        child.getBoundingClientRect().left - trackLeft,
      );

      if (currentDistance < distance) {
        distance = currentDistance;
        nearest = index;
      }
    });

    setActiveIndex(nearest);
  };

  return (
    <section
      ref={sectionRef}
      id="client-feedback"
      className="public-section home-client-feedback"
      aria-labelledby="client-feedback-title"
    >
      <motion.div
        className="client-feedback-layout"
        style={{
          opacity: reducedMotion ? 1 : opacity,
          y: reducedMotion ? 0 : y,
        }}
      >
        <motion.div
          className="client-feedback-intro"
          initial={reducedMotion ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.95,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <h2 id="client-feedback-title">
            In their
            <br />
            own words
            <span className="client-feedback-dot" aria-hidden="true" />
          </h2>

          <p>
            Behind every technical challenge is a business, a team and a
            different way of working. Meaningful progress starts with listening,
            understanding and finding the right way forward.
          </p>
        </motion.div>

        <div className="client-feedback-showcase">
          <div
            ref={trackRef}
            className="client-feedback-track"
            role="region"
            aria-roledescription="carousel"
            aria-label="Client perspectives"
            tabIndex={0}
            onScroll={updateActive}
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
            {feedback.map((item, index) => (
              <motion.article
                key={item.name}
                className="client-feedback-card"
                role="group"
                aria-roledescription="slide"
                aria-label={item.name}
                initial={reducedMotion ? false : { opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.8,
                  delay: reducedMotion ? 0 : index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="client-feedback-card-top">
                  <Quote size={34} strokeWidth={1.5} aria-hidden="true" />

                  <div className="client-feedback-avatar">
                    {item.portrait ? (
                      <img src={item.portrait} alt="" loading="lazy" />
                    ) : (
                      <span>{item.initials}</span>
                    )}
                  </div>
                </div>

                <blockquote>
                  <span>{item.opening}</span>
                  <strong>{item.highlight}</strong>
                  <span>{item.ending}</span>
                </blockquote>

                <div className="client-feedback-person">
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="client-feedback-navigation">
            <div className="client-feedback-progress">
              {feedback.map((item, index) => (
                <button
                  type="button"
                  key={item.name}
                  className={`client-feedback-progress-dot${
                    index === activeIndex ? " is-active" : ""
                  }`}
                  aria-label={`Show feedback from ${item.name}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>

            <div className="client-feedback-arrows">
              <button
                type="button"
                aria-label="Previous feedback"
                disabled={activeIndex === 0}
                onClick={() => goTo(activeIndex - 1)}
              >
                <ChevronLeft size={20} strokeWidth={1.5} />
              </button>

              <button
                type="button"
                aria-label="Next feedback"
                disabled={activeIndex === feedback.length - 1}
                onClick={() => goTo(activeIndex + 1)}
              >
                <ChevronRight size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <p className="client-feedback-sr-only" aria-live="polite">
            Showing feedback from {feedback[activeIndex].name}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
