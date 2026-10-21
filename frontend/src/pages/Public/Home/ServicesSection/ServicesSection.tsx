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
    </section>
  );
}
