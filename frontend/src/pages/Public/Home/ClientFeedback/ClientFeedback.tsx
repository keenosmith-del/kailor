import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./ClientFeedback.css";

type ClientNote = {
  id: string;
  role: string;
  avatar: string;
  message: string;
};

// Demonstration content, NOT customer endorsements.
// Replace every entry with approved, attributable client feedback before launch.
const notes: ClientNote[] = [
  {
    id: "01",
    role: "Business owner",
    avatar: "/clients/1.jpeg",
    message:
      "We thought we needed another platform. It turned out we could fix most of the problem by connecting what we already used.",
  },
  {
    id: "02",
    role: "Operations lead",
    avatar: "/clients/2.jpeg",
    message:
      "The best part was having the technical options explained without the jargon. Our team could actually make a decision.",
  },
  {
    id: "03",
    role: "Founder",
    avatar: "/clients/3.jpeg",
    message:
      "There wasn't any pressure to build more than we needed. We started with the bit that was slowing everyone down.",
  },
  {
    id: "04",
    role: "Project lead",
    avatar: "/clients/4.jpeg",
    message:
      "We could see what was being proposed, why it mattered and what still needed a decision. That made the next steps easier.",
  },
  {
    id: "05",
    role: "Business director",
    avatar: "/clients/5.jpeg",
    message:
      "It felt like someone was looking at how our business really works, not trying to fit us into a ready-made solution.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function ClientFeedback() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isVisible = useInView(sectionRef, { amount: 0.28 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Rotate only while the section is visible; no hidden background animation.
  useEffect(() => {
    if (!isVisible || reducedMotion || paused) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActiveIndex((current) => (current + 1) % notes.length);
      }
    }, 6300);

    return () => window.clearInterval(timer);
  }, [isVisible, paused, reducedMotion]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.78, 1],
    [0, 1, 1, 0],
  );

  const sectionY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.78, 1],
    [28, 0, 0, -18],
  );

  const active = notes[activeIndex];

  return (
    <motion.section
      ref={sectionRef}
      id="client-feedback"
      className="public-section home-client-notes"
      aria-labelledby="client-notes-title"
      style={{
        opacity: reducedMotion ? 1 : sectionOpacity,
        y: reducedMotion ? 0 : sectionY,
      }}
    >
      <div className="client-notes-layout">
        <motion.div
          className="client-notes-copy"
          initial={reducedMotion ? false : { opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reducedMotion ? 0 : 0.9, ease }}
        >
          <h2 id="client-notes-title">In their words</h2>

          <p>
            Different businesses. Different challenges. A few perspectives on
            what changed, what helped, and what mattered along the way.
          </p>

          <Link className="client-notes-cta" to="/create-account">
            Get started
          </Link>
        </motion.div>

        <motion.div
          className="client-notes-scene"
          initial={reducedMotion ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: reducedMotion ? 0 : 0.9,
            delay: reducedMotion ? 0 : 0.16,
            ease,
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          aria-label="Client perspectives"
        >
          <div className="client-notes-message-area">
            <article className="client-notes-bubble">
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={active.id}
                  className="client-notes-content"
                  initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{
                    opacity: {
                      duration: reducedMotion ? 0 : 0.9,
                      ease: "easeInOut",
                    },
                    y: {
                      duration: reducedMotion ? 0 : 0.9,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }}
                >
                  <div className="client-notes-person">
                    <img
                      src={active.avatar}
                      alt=""
                      width={43}
                      height={43}
                      loading="lazy"
                      decoding="async"
                    />

                    <div className="client-notes-person-text">
                      <strong>{active.role}</strong>
                    </div>
                  </div>

                  <p className="client-notes-message">{active.message}</p>
                </motion.div>
              </AnimatePresence>
            </article>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
