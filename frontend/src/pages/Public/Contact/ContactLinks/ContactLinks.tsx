import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import "./ContactLinks.css";
export function ContactLinks() {
  return (
    <section className="public-section contact-links">
      <h2>
        A little context
        <br />
        <span>before we speak.</span>
      </h2>
      <div>
        <Link to="/services">
          Explore the services <ArrowUpRight size={20} />
        </Link>
        <Link to="/how-it-works">
          Understand the process <ArrowUpRight size={20} />
        </Link>
        <Link to="/contact">
          Ways to work together <ArrowUpRight size={20} />
        </Link>
      </div>
    </section>
  );
}
