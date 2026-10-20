import { useRef } from "react";
import { Link } from "react-router";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { MediaSection } from "../../../../components/public/MediaSection/MediaSection";
import { media } from "../../media";
import "./Hero.css";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const scrollOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0]);

  return (
    <motion.section
      ref={heroRef}
      className="kailor-hero"
      aria-labelledby="hero-title"
      style={{
        opacity: reducedMotion ? 1 : scrollOpacity,
      }}
    >
      <MediaSection media={media.hero} background>
        <div className="kailor-hero__fallback" />
      </MediaSection>

      <div className="kailor-hero__overlay" aria-hidden="true" />

      <div className="kailor-hero__content">
        <h1 id="hero-title">
          Technology that
          <br />
          works for you.
        </h1>

        <p>
          From a first business idea to complex software and AI systems, kailor
          helps you choose, build and improve technology around your goals.
        </p>

        <div className="kailor-hero__actions">
          <Link className="pub-pill pub-pill-dark" to="/contact">
            Get in touch
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
