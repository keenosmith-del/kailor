import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import "./Founder.css";
export function Founder() {
  return (
    <section className="public-section about-founder">
      <span>Founder-led, personally considered</span>
      <h2>
        A direct conversation.
        <br />
        <span>A practical point of view.</span>
      </h2>
      <p>
        kailor is led by Keeno Smith. Enquiries begin directly with the founder,
        so we can understand what you're working towards and whether there is a
        useful fit.
      </p>
      <Link className="pub-pill pub-pill-dark" to="/contact">
        Get in touch <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
