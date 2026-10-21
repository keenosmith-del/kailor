import { useRef } from "react";
import {
  BrainCircuit,
  Cloud,
  Code2,
  Workflow,
  Compass,
  Database,
  Network,
  Layers3,
  ChartNoAxesCombined,
  Blocks,
  SearchCheck,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import "./Marquee.css";

type MarqueeItem = {
  name: string;
  icon?: LucideIcon;
  logo?: string;
  technology?: boolean;
};

const marqueeItems: MarqueeItem[] = [
  { name: "Technology consulting", icon: Compass },
  { name: "Software engineering", icon: Code2 },
  { name: "Artificial intelligence", icon: BrainCircuit },
  { name: "Business automation", icon: Workflow },
  { name: "Cloud infrastructure", icon: Cloud },
  { name: "System integrations", icon: Network },
  { name: "Data & analytics", icon: ChartNoAxesCombined },
  { name: "Digital platforms", icon: Layers3 },
  { name: "Data engineering", icon: Database },
  { name: "Solution architecture", icon: Blocks },
  { name: "Discovery & analysis", icon: SearchCheck },
  { name: "Client collaboration", icon: MessageSquareText },
  { name: "React", technology: true },
  { name: "TypeScript", technology: true },
  { name: "Python", technology: true },
  { name: "n8n", technology: true },
  { name: "Ollama", technology: true },
  { name: "Azure", technology: true },
];

function MarqueeGroup({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="home-marquee__group" aria-hidden={duplicate}>
      {marqueeItems.map((item) => {
        const Icon = item.icon;

        return (
          <div className="home-marquee__item" key={item.name}>
            <div className="home-marquee__emblem">
              <img
                className="home-marquee__wreath"
                src="/laurel-wreath.png"
                alt=""
                draggable={false}
              />

              <span className="home-marquee__symbol">
                {item.logo ? (
                  <img
                    className="home-marquee__logo"
                    src={item.logo}
                    alt=""
                    loading="lazy"
                  />
                ) : Icon ? (
                  <Icon size={27} strokeWidth={1.45} aria-hidden="true" />
                ) : (
                  <span
                    className={`home-marquee__wordmark${
                      item.technology ? " is-technology" : ""
                    }`}
                  >
                    {item.name}
                  </span>
                )}
              </span>
            </div>

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
          once: true,
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
