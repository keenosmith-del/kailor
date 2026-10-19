import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Engagements } from "../../../../components/public/Engagements/Engagements";
import "./EngagementSection.css";
export function EngagementSection() {
  return (
    <section className="public-section home-engagements" id="engagements">
      <div className="section-prelude">
        <span>Ways to work with kailor</span>
        <Link className="pub-text-link" to="/pricing">
          Engagement details <ArrowUpRight size={17} />
        </Link>
      </div>
      <h2>
        The right level
        <br />
        <span>of support.</span>
      </h2>
      <Engagements />
    </section>
  );
}
