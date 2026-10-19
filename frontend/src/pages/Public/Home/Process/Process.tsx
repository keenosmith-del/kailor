import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { ProcessTimeline } from "../../../../components/public/ProcessTimeline/ProcessTimeline";
import "./Process.css";
export function Process() {
  return (
    <section className="public-section home-process" id="process">
      <div className="section-prelude">
        <span>How kailor works</span>
        <Link className="pub-text-link" to="/how-it-works">
          The full process <ArrowUpRight size={17} />
        </Link>
      </div>
      <h2>
        A little more clarity.
        <br />
        <span>At every step.</span>
      </h2>
      <ProcessTimeline />
    </section>
  );
}
