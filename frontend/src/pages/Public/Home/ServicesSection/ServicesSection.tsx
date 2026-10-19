import { StackedPanels } from "../../../../components/public/StackedPanels/StackedPanels";
import "./ServicesSection.css";
export function ServicesSection() {
  return (
    <section
      className="home-services public-section"
      aria-labelledby="services-title"
    >
      <div className="section-prelude">
        <span>What we do</span>
        <span>Different disciplines. One considered approach.</span>
      </div>
      <h2 id="services-title">
        From the right question
        <br />
        to the <span>right solution.</span>
      </h2>
      <StackedPanels />
    </section>
  );
}
