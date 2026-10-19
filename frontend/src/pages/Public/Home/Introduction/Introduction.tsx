import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import "./Introduction.css";
export function Introduction() {
  return (
    <section className="public-section home-introduction" id="introduction">
      <div className="section-prelude">
        <span>Meet kailor</span>
        <span>Consultancy + engineering + intelligence</span>
      </div>
      <h2>
        Good technology starts
        <br />
        with <span className="kinetic-word">understanding.</span>
      </h2>
      <div className="introduction-aside">
        <span className="tiny-orbit" aria-hidden="true">
          ✳
        </span>
        <div>
          <p>
            We bring practical consulting, software engineering and intelligent
            assessment together to help you make better technology decisions.
          </p>
          <p>
            For the idea taking shape. The business ready to work better. The
            technical challenge that needs a thoughtful solution.
          </p>
          <Link className="pub-text-link" to="/about">
            A little more about kailor <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
