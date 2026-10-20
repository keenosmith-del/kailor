import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import "./StackedPanels.css";

const services = [
  {
    title: "Technology consultancy",
    lead: "The right solution begins with understanding the business, not choosing the technology.",
    description:
      "Whether you're launching something new, improving an established operation or considering a major technical investment, kailor helps you work out what actually needs to change. We examine your goals, existing systems, daily processes, constraints and opportunities before proposing an approach.",
    detail:
      "That can mean evaluating software platforms, identifying operational improvements, developing a technology roadmap or defining the scope of a new system. We bring business thinking and technical expertise together so decisions are practical, informed and built around your circumstances.",
  },
  {
    title: "Software engineering",
    lead: "Custom software designed around real requirements, built to work beyond the first release.",
    description:
      "We design and develop digital products and business systems, including web applications, customer portals, internal tools, APIs and connected platforms. From architecture and data modelling to application interfaces and backend services, the engineering is shaped by how people will actually use the software.",
    detail:
      "Our work considers performance, maintainability, security, integrations and future growth. Whether it's a focused application or a more complex connected system, we aim to deliver reliable software with a clear purpose and a foundation that can evolve.",
  },
  {
    title: "AI & automation",
    lead: "Intelligent technology that supports your work rather than adding another layer of complexity.",
    description:
      "We identify opportunities to reduce repetitive administration, connect disconnected processes and make better use of business information. Solutions can combine language models, intelligent assistants, structured workflows, APIs and conventional software automation.",
    detail:
      "This includes AI-enabled applications, knowledge systems, document processing, customer operations and coordinated multi-step workflows. We design around the process first, then consider reliability, data protection, human oversight and the points where automated actions need review.",
  },
  {
    title: "Cloud & infrastructure",
    lead: "The technical foundation behind applications, connected services and dependable operations.",
    description:
      "We help plan, build and improve the infrastructure supporting modern software. That includes application hosting, cloud architecture, deployments, databases, service integrations and the environments needed to run and maintain connected systems.",
    detail:
      "Cloud decisions are made with operating costs, security, access, monitoring, resilience and future requirements in mind. The goal isn't unnecessary complexity; it's infrastructure that supports the business today while remaining manageable as its needs change.",
  },
];

type Service = (typeof services)[number];

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
      className="service-panel"
      style={{
        top: `${96 + index * 15}px`,
        zIndex: index + 1,
      }}
    >
      <motion.div
        className="service-panel-inner"
        style={{
          scale: reducedMotion ? 1 : scale,
        }}
      >
        <div className="service-panel-heading">
          <h3>{service.title}</h3>
        </div>

        <div className="service-panel-description">
          <p className="service-panel-lead">{service.lead}</p>

          <p>{service.description}</p>
          <p>{service.detail}</p>
        </div>
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
          key={service.title}
          service={service}
          index={index}
          progress={scrollYProgress}
        />
      ))}
    </div>
  );
}
