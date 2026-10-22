import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Code2,
  Compass,
  MessageCircle,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";

import "./StackedPanels.css";
import { useDocumentVisible } from "../useDocumentVisible";

type ServiceKind = "consultancy" | "software" | "automation" | "cloud";

type Service = {
  kind: ServiceKind;
  title: string;
  lead: string;
  description: string;
};

const services: Service[] = [
  {
    kind: "consultancy",
    title: "Technology consultancy",
    lead: "Before we build anything, we ask better questions.",
    description:
      "We examine your goals, processes and existing systems before recommending what comes next. Sometimes the answer is a new product. Sometimes it's making what you already have work properly.",
  },
  {
    kind: "software",
    title: "Software engineering",
    lead: "Your business shouldn't have to work around its software.",
    description:
      "From customer portals to internal platforms, we engineer software around the people who use it — with the architecture to support what happens after launch.",
  },
  {
    kind: "automation",
    title: "AI & automation",
    lead: "There's better work for your people to be doing.",
    description:
      "We bring intelligent assistance and connected workflows into everyday operations, with appropriate human review where decisions need care.",
  },
  {
    kind: "cloud",
    title: "Cloud & infrastructure",
    lead: "The important work happens behind the scenes.",
    description:
      "Reliable hosting, databases, deployments and connected services. We design foundations around security, operating costs and what your business will need next.",
  },
];

const panelReveal: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.78,
      ease: [0.22, 1, 0.36, 1],
      delayChildren: 0.1,
      staggerChildren: 0.16,
    },
  },
};

const layerReveal: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

const changeTransition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

// Timed motion runs only while a panel's visual is visible, and is
// automatically disabled for people who prefer reduced motion.
function useVisualCycle(length: number, delay: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const documentVisible = useDocumentVisible();
  const visible = inView && documentVisible;
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible || reducedMotion || length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [delay, length, reducedMotion, visible]);

  return { ref, index, reducedMotion, visible };
}

const challenges = [
  "Our systems don't talk to each other.",
  "We're spending too much time on admin.",
  "We have the idea. Where do we start?",
];

function ConsultancyVisual() {
  const { ref, index, reducedMotion } = useVisualCycle(challenges.length, 3600);

  return (
    <div
      ref={ref}
      className="service-art service-art--consultancy"
      aria-label="Illustrative discovery conversation"
    >
      <motion.div
        className="service-art__layer service-art__discovery"
        variants={layerReveal}
      >
        <div className="service-art__label">
          <Compass size={15} strokeWidth={1.6} /> A good place to begin
        </div>
        <div className="service-art__large-quote">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={index}
              initial={reducedMotion ? false : { opacity: 0, y: 9 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -9 }}
              transition={changeTransition}
            >
              “{challenges[index]}”
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="service-art__mini-rail" aria-hidden="true">
          {challenges.map((_, i) => (
            <span className={i === index ? "is-active" : ""} key={i} />
          ))}
        </div>
      </motion.div>
      <motion.div
        className="service-art__layer service-art__direction"
        variants={layerReveal}
      >
        <span className="service-art__eyebrow">Our first priority</span>
        <strong>Understand the real problem.</strong>
        <ArrowRight size={18} strokeWidth={1.4} />
      </motion.div>
    </div>
  );
}

const workspaces = [
  {
    tab: "Overview",
    headline: "Everything, connected.",
    detail: "Projects, information and people in one place.",
    progress: "72%",
  },
  {
    tab: "Projects",
    headline: "Work you can follow.",
    detail: "Clear progress, decisions and next steps.",
    progress: "48%",
  },
  {
    tab: "Activity",
    headline: "Nothing gets lost.",
    detail: "The right updates at the right time.",
    progress: "88%",
  },
];

function SoftwareVisual() {
  const { ref, index, reducedMotion } = useVisualCycle(workspaces.length, 3900);
  const current = workspaces[index];

  return (
    <div
      ref={ref}
      className="service-art service-art--software"
      aria-label="Illustrative application interface"
    >
      <motion.div
        className="service-art__layer service-art__workspace"
        variants={layerReveal}
      >
        <div className="service-art__window-top">
          <span>
            <Code2 size={14} strokeWidth={1.5} /> workspace
          </span>
          <span className="service-art__window-status">
            <span /> Interactive preview
          </span>
        </div>
        <div className="service-art__workspace-body">
          <div className="service-art__tabs">
            {workspaces.map((item, i) => (
              <span className={index === i ? "is-active" : ""} key={item.tab}>
                {item.tab}
              </span>
            ))}
          </div>
          <div className="service-art__workspace-content">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.tab}
                className="service-art__workspace-copy"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={changeTransition}
              >
                <span className="service-art__eyebrow">
                  Designed around your work
                </span>
                <strong>{current.headline}</strong>
                <p>{current.detail}</p>
              </motion.div>
            </AnimatePresence>
            <div className="service-art__progress-track" aria-hidden="true">
              <motion.span
                initial={false}
                animate={{ width: current.progress }}
                transition={{
                  duration: reducedMotion ? 0 : 0.9,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="service-art__layer service-art__workspace-pill"
        variants={layerReveal}
      >
        <Check size={15} strokeWidth={1.5} /> Thoughtfully engineered
      </motion.div>
    </div>
  );
}

const workflowSteps = [
  { icon: MessageCircle, name: "Enquiry received", detail: "Capture" },
  { icon: Workflow, name: "Assisted processing", detail: "Organise" },
  { icon: Check, name: "Human review", detail: "Approve" },
];

function AutomationVisual() {
  const { ref, index } = useVisualCycle(workflowSteps.length, 1500);

  return (
    <div
      ref={ref}
      className="service-art service-art--automation"
      aria-label="Illustrative automated workflow"
    >
      <motion.div
        className="service-art__layer service-art__automation-shell"
        variants={layerReveal}
      >
        <div className="service-art__label">
          <Workflow size={15} strokeWidth={1.6} /> Workflows that move
        </div>
        <div className="service-art__steps">
          {workflowSteps.map(({ icon: Icon, name, detail }, i) => (
            <div
              key={name}
              className={`service-art__step${index === i ? " is-active" : ""}`}
            >
              <span className="service-art__step-icon">
                <Icon size={17} strokeWidth={1.5} />
              </span>
              <span className="service-art__step-name">{name}</span>
              <span className="service-art__step-detail">{detail}</span>
              {index === i && (
                <motion.span
                  layoutId="active-workflow-step"
                  className="service-art__step-indicator"
                  transition={{ type: "spring", stiffness: 170, damping: 25 }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="service-art__flow-caption">
          <ShieldCheck size={15} strokeWidth={1.5} /> Oversight stays part of
          the process
        </div>
      </motion.div>
    </div>
  );
}

// The original in-page typography animation is the only cloud visual.
const cloudWords = [
  "clarity",
  "growth",
  "momentum",
  "automation",
  "scale",
  "change",
];

export function CloudVisual() {
  const { ref, index, reducedMotion } = useVisualCycle(cloudWords.length, 1650);

  return (
    <div
      ref={ref}
      className="service-art service-art--cloud"
      aria-label="Built for clarity, growth, momentum, automation, scale and change"
    >
      <div className="service-art__word-preview">
        <span className="service-art__word-prefix">Built for</span>
        <div className="service-art__changing-word" aria-live="off">
          <AnimatePresence mode="wait" initial={false}>
            <motion.strong
              key={index}
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 14, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reducedMotion
                  ? undefined
                  : { opacity: 0, y: -14, filter: "blur(4px)" }
              }
              transition={{
                duration: reducedMotion ? 0 : 0.43,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {cloudWords[index]}.
            </motion.strong>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ServiceVisual({ kind }: { kind: ServiceKind }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`service-panel-visual service-panel-visual--${kind}`}
      variants={panelReveal}
      initial={reducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: kind === "cloud", amount: 0.24 }}
    >
      {kind === "consultancy" && <ConsultancyVisual />}
      {kind === "software" && <SoftwareVisual />}
      {kind === "automation" && <AutomationVisual />}
      {kind === "cloud" && <CloudVisual />}
    </motion.div>
  );
}

function ServicePanel({
  service,
  index,
  progress,
}: {
  service: Service;
  index: number;
  progress: MotionValue<number>;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useTransform(
    progress,
    [index / (services.length + 1), (index + 1.75) / (services.length + 1)],
    [1, 0.96],
  );

  return (
    <article
      className={`service-panel service-panel--${service.kind}`}
      style={{ top: `${96 + index * 15}px`, zIndex: index + 1 }}
    >
      <motion.div
        className="service-panel-inner"
        style={{ scale: reducedMotion ? 1 : scale }}
      >
        <div className="service-panel-copy">
          <motion.div
            className="service-panel-heading"
            initial={reducedMotion ? false : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3>{service.title}</h3>
          </motion.div>
          <motion.div
            className="service-panel-description"
            initial={reducedMotion ? false : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{
              duration: 0.75,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="service-panel-lead">{service.lead}</p>
            <p>{service.description}</p>
          </motion.div>
        </div>
        <ServiceVisual kind={service.kind} />
      </motion.div>
    </article>
  );
}

export function StackedPanels() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={ref} className="stacked-panels">
      {services.map((service, index) => (
        <ServicePanel
          key={service.kind}
          service={service}
          index={index}
          progress={scrollYProgress}
        />
      ))}
    </div>
  );
}
