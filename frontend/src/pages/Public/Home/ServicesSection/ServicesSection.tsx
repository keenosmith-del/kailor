import { Link } from "react-router";
import { ProcessReveal } from "../../HowItWorks/ProcessReveal";
import { StackedPanels } from "../../../../components/public/StackedPanels/StackedPanels";
import "./ServicesSection.css";

export function ServicesSection() {
  return (
    <section
      className="home-services public-section"
      id="services-overview"
      aria-label="What kailor does"
    >
      <StackedPanels />
      <ProcessReveal className="services-questions-action">
        <Link className="pub-pill pub-pill-dark" to="/questions">
          Common questions
        </Link>
      </ProcessReveal>
    </section>
  );
}
