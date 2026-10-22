import { useDocumentVisible } from "../../../../components/public/useDocumentVisible";
import { showClientPerspectives } from "../../../../components/public/navigation";
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

import "./ClientPerspectives.css";

type ClientNote = {
  id: string;
  role: string;
  avatar: string;
  date: string;
  message: string;
};

// Demonstration content, NOT customer endorsements.
// Replace every entry with approved, attributable client feedback before launch.
const notes: ClientNote[] = [
  {
    id: "01",
    role: "Business owner",
    avatar: "/clients/21.jpeg",
    date: "2025-04-18",
    message:
      "We thought we needed another platform. It turned out we could fix most of the problem by connecting what we already used.",
  },
  {
    id: "02",
    role: "Operations lead",
    avatar: "/clients/22.jpeg",
    date: "2025-06-04",
    message:
      "The best part was having the technical options explained without the jargon. Our team could actually make a decision.",
  },
  {
    id: "03",
    role: "Founder",
    avatar: "/clients/23.jpeg",
    date: "2025-08-22",
    message:
      "There wasn't any pressure to build more than we needed. We started with the bit that was slowing everyone down.",
  },
  {
    id: "04",
    role: "Project lead",
    avatar: "/clients/24.jpeg",
    date: "2025-10-10",
    message:
      "We could see what was being proposed, why it mattered and what still needed a decision. That made the next steps easier.",
  },
  {
    id: "05",
    role: "Business director",
    avatar: "/clients/25.jpeg",
    date: "2025-12-02",
    message:
      "It felt like someone was looking at how our business really works, not trying to fit us into a ready-made solution.",
  },
  {
    id: "06",
    role: "Studio owner",
    avatar: "/clients/26.jpeg",
    date: "2026-02-16",
    message: "Having a clear scope helped us choose a sensible first step.",
  },
  {
    id: "07",
    role: "Team lead",
    avatar: "/clients/27.jpeg",
    date: "2026-04-08",
    message: "We needed something our team could maintain and understand.",
  },
  {
    id: "08",
    role: "Practice manager",
    avatar: "/clients/28.jpeg",
    date: "2026-06-19",
    message: "Connecting our existing tools made the work easier to follow.",
  },
  {
    id: "09",
    role: "Independent professional",
    avatar: "/clients/29.jpeg",
    date: "2026-08-07",
    message:
      "The discussion helped us separate the immediate need from the longer-term idea.",
  },
  {
    id: "10",
    role: "Operations manager",
    avatar: "/clients/30.jpeg",
    date: "2026-10-05",
    message:
      "The decisions and next steps were documented so everyone could refer back to them.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

function LocalClientPerspectives() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const documentVisible = useDocumentVisible();
  const isVisible = useInView(sectionRef, { amount: 0.28 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Rotate only while the section is visible; no hidden background animation.
  useEffect(() => {
    if (!isVisible || !documentVisible || reducedMotion || paused) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActiveIndex((current) => (current + 1) % notes.length);
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isVisible, documentVisible, paused, reducedMotion]);

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
          viewport={{ once: false, amount: 0.2 }}
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
          viewport={{ once: false, amount: 0.15 }}
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
                      <small>
                        <time dateTime={active.date}>
                          {new Intl.DateTimeFormat("en", {
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC",
                          }).format(new Date(active.date))}
                        </time>
                      </small>
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

export function ClientPerspectives() {
  return showClientPerspectives ? <LocalClientPerspectives /> : null;
}
