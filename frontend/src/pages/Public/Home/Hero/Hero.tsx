import { useRef } from "react";
import { Link } from "react-router";
import { useConversation } from "../../../../components/public/ConversationModal/ConversationModal";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./Hero.css";

type ClientRequest = {
  initials: string;
  message: string;
  avatar?: string;
};

const clientRequests: ClientRequest[] = [
  {
    initials: "AM",
    message: "Can we automate our bookings?",
    avatar: "/clients/1.jpeg",
  },
  {
    initials: "JL",
    message: "We need a better website.",
    avatar: "/clients/2.jpeg",
  },
  {
    initials: "TR",
    message: "Could AI help our team?",
    avatar: "/clients/3.jpeg",
  },
  {
    initials: "SK",
    message: "Our systems need to connect.",
    avatar: "/clients/4.jpeg",
  },
  {
    initials: "NB",
    message: "We need a custom platform.",
    avatar: "/clients/5.jpeg",
  },
  {
    initials: "CP",
    message: "Can we simplify our workflow?",
    avatar: "/clients/6.jpeg",
  },
  {
    initials: "MJ",
    message: "We want to move to the cloud.",
    avatar: "/clients/7.jpeg",
  },
  {
    initials: "LH",
    message: "Our reporting takes too long.",
    avatar: "/clients/8.jpeg",
  },
  {
    initials: "DW",
    message: "Where should we start with AI?",
    avatar: "/clients/9.jpeg",
  },
  {
    initials: "RS",
    message: "Can our tools work together?",
    avatar: "/clients/10.jpeg",
  },
];

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { openConversation } = useConversation();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"],
  });

  const scrollOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.7, 1],
    [0, 1, 1, 0],
  );

  return (
    <motion.div
      className="kailor-hero__load"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <motion.section
        ref={heroRef}
        className="kailor-hero"
        id="hero"
        aria-labelledby="hero-title"
        style={{
          opacity: reducedMotion ? 1 : scrollOpacity,
        }}
      >
        <div className="kailor-hero__inner">
          <motion.div
            className="kailor-hero__content"
            initial={reducedMotion ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <h1 id="hero-title">Technology that works for you</h1>

            <p className="kailor-hero__description">
              Independent technology consultancy, software engineering,
              artificial intelligence, automation and cloud expertise — brought
              together to understand your challenges and build practical,
              considered solutions around your goals.
            </p>

            <div className="kailor-hero__actions">
              <button
                type="button"
                className="kailor-hero__primary"
                onClick={openConversation}
              >
                Start a conversation
              </button>

              <Link className="kailor-hero__secondary" to="/how-it-works">
                Explore what we do
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="kailor-hero__scene"
            initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 1.1,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="kailor-hero__requests" aria-hidden="true">
              {clientRequests.map((request, index) => (
                <div
                  key={request.message}
                  className={`kailor-hero__request kailor-hero__request--${index + 1}`}
                  style={{
                    animationDelay: `${index * -1.4}s`,
                  }}
                >
                  <span className="kailor-hero__avatar">
                    {request.avatar ? (
                      <img src={request.avatar} alt="" />
                    ) : (
                      request.initials
                    )}
                  </span>

                  <span className="kailor-hero__request-text">
                    {request.message}
                  </span>
                </div>
              ))}
            </div>

            <div className="kailor-hero__ground" aria-hidden="true" />

            <img
              className="kailor-hero__mascot"
              src="/mascot/other/kailor-sitting-arms-folded.png"
              alt="Kailor, our mascot, sitting with his arms folded"
              fetchPriority="high"
              draggable={false}
            />
          </motion.div>

          <p className="kailor-hero__mascot-note">
            <span className="kailor-hero__mascot-note-label"></span>

            <span>
              The crossed arms are a design choice, not our customer-service
              policy. Promise, we're friendly 🥰
            </span>
          </p>
        </div>
      </motion.section>
    </motion.div>
  );
}
