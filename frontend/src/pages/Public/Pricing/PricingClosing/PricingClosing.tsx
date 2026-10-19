import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import "./PricingClosing.css";
export function PricingClosing() {
  return (
    <section className="public-page-closing">
      <h2>
        Let's define
        <br />
        what useful looks like.
      </h2>
      <Link className="pub-pill pub-pill-dark" to="/contact">
        Discuss your situation <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
