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
  // Languages and frameworks
  {
    name: "React",
    logo: "/technology/react.svg",
    technology: true,
  },
  {
    name: "TypeScript",
    logo: "/technology/typescript.svg",
    technology: true,
  },
  {
    name: "JavaScript",
    logo: "/technology/javascript.svg",
    technology: true,
  },
  {
    name: "Python",
    logo: "/technology/python.svg",
    technology: true,
  },

  // Artificial intelligence
  {
    name: "Claude",
    logo: "/technology/claude.svg",
    technology: true,
  },
  {
    name: "Anthropic",
    logo: "/technology/anthropic.svg",
    technology: true,
  },
  {
    name: "Claude Code",
    logo: "/technology/claudecode.svg",
    technology: true,
  },
  {
    name: "DeepSeek",
    logo: "/technology/deepseek.svg",
    technology: true,
  },
  {
    name: "Google Gemini",
    logo: "/technology/googlegemini.svg",
    technology: true,
  },
  {
    name: "Hugging Face",
    logo: "/technology/huggingface.svg",
    technology: true,
  },
  {
    name: "Ollama",
    logo: "/technology/ollama.svg",
    technology: true,
  },

  // Automation and APIs
  {
    name: "n8n",
    logo: "/technology/n8n.svg",
    technology: true,
  },
  {
    name: "Postman",
    logo: "/technology/postman.svg",
    technology: true,
  },
  {
    name: "JSON Web Tokens",
    logo: "/technology/jsonwebtokens.svg",
    technology: true,
  },

  // Databases
  {
    name: "PostgreSQL",
    logo: "/technology/postgresql.svg",
    technology: true,
  },
  {
    name: "SQLite",
    logo: "/technology/sqlite.svg",
    technology: true,
  },

  // Cloud and deployment
  {
    name: "Google Cloud",
    logo: "/technology/googlecloud.svg",
    technology: true,
  },
  {
    name: "Render",
    logo: "/technology/render.svg",
    technology: true,
  },
  {
    name: "Vercel",
    logo: "/technology/vercel.svg",
    technology: true,
  },
  {
    name: "Azure",
    logo: "/technology/azure.svg",
    technology: true,
  },
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
