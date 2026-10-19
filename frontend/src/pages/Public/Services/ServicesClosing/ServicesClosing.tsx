import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import "./ServicesClosing.css";
export function ServicesClosing() {
  return (
    <section className="public-page-closing">
      <h2>
        A good solution starts
        <br />
        with a better question.
      </h2>
      <Link className="pub-pill pub-pill-dark" to="/how-it-works">
        How we work <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
