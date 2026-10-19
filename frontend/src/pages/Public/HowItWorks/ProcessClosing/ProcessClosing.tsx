import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import "./ProcessClosing.css";
export function ProcessClosing() {
  return (
    <section className="public-page-closing">
      <h2>
        Bring the question.
        <br />
        We'll start there.
      </h2>
      <Link className="pub-pill pub-pill-dark" to="/contact">
        Start a conversation <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
