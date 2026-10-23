import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./Marquee.css";

import { marqueeItems } from "./marqueeData";

function MarqueeGroup({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="home-marquee__group" aria-hidden={duplicate}>
      {marqueeItems.map((item) => {
        const Icon = item.icon;

        return (
          <div className="home-marquee__item" key={item.name}>
            <span className="home-marquee__symbol">
              {item.logo ? (
                <img
                  className="home-marquee__logo"
                  src={item.logo}
                  alt=""
                  width={26}
                  height={26}
                  draggable={false}
                />
              ) : item.icon ? (
                <item.icon size={25} strokeWidth={1.45} aria-hidden="true" />
              ) : null}
            </span>

            <span className="home-marquee__name">{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Marquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.75, 1],
    [0, 1, 1, 0],
  );

  return (
    <motion.section
      ref={sectionRef}
      className="home-marquee"
      id="technologies"
      aria-labelledby="home-marquee-title"
      style={{
        opacity: reducedMotion ? 1 : opacity,
      }}
    >
      <motion.div
        className="home-marquee__body"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{
          once: false,
          amount: 0.12,
        }}
        transition={{
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="home-marquee__intro">
          <h2 id="home-marquee-title">
            The expertise and technology behind the work
          </h2>
        </div>

        <div
          className="home-marquee__viewport"
          role="region"
          aria-label="Capabilities and technologies"
          tabIndex={reducedMotion ? 0 : undefined}
        >
          <div className="home-marquee__track">
            <MarqueeGroup />
            <MarqueeGroup duplicate />
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
