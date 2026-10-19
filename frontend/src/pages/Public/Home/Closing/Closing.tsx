import { ArrowUpRight } from "lucide-react";
import { mail } from "../../content";
import "./Closing.css";
export function Closing() {
  return (
    <section className="public-section home-closing">
      <span>A good place to begin</span>
      <h2>
        Let's make
        <br />
        <span>the next step</span> clear.
      </h2>
      <div>
        <p>
          Tell us what you're thinking about.
          <br />
          We'll start with a conversation.
        </p>
        <a
          className="pub-pill pub-pill-dark"
          href={mail("Let's talk about technology")}
        >
          Let's talk <ArrowUpRight size={18} />
        </a>
      </div>
    </section>
  );
}
