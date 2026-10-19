import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { ProcessTimeline } from "../../../components/public/Visuals";
import { steps } from "../content";
import "./HowItWorks.css";
export default function HowItWorks() {
  return (
    <>
      <header className="public-page-hero">
        <span>How it works</span>
        <h1>
          Understand first.
          <br />
          <span>Move forward thoughtfully.</span>
        </h1>
        <p>
          You can arrive with a rough idea, a recurring frustration or a
          detailed technical brief. The process starts by understanding the
          situation.
        </p>
      </header>
      <section className="public-section process-page-diagram">
        <h2 className="sr-only">The process at a glance</h2>
        <ProcessTimeline full />
      </section>
      <section className="public-section process-editorial">
        <div>
          <h2>
            Clarity is
            <br />
            <span>a process.</span>
          </h2>
          <p>
            The platform can support exploration, context gathering and
            structured assessment. Consultant input and implementation are
            separate engagements, agreed with you.
          </p>
        </div>
        <div className="process-chapters">
          {steps.map(([title, text], i) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
              <p>
                {
                  [
                    "Bring the information you have. You do not need to know which technology you want, or have an established business.",
                    "Separate what is known from what is assumed. Identify who is involved, what already works and what would make a useful improvement.",
                    "Existing platforms, process changes and custom development are considered on their merits. Dependencies, cost and feasibility need explicit checking.",
                    "Recommendations are directions to evaluate, not automatic purchases or approvals. Review the evidence, limitations and proposed next step.",
                    "Any delivery work needs an agreed scope, quote, access arrangements and responsibilities. A platform recommendation does not commission work.",
                  ][i]
                }
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="public-section human-ai">
        <h2>
          AI assists.
          <br />
          <span>People decide.</span>
        </h2>
        <div>
          <p>
            AI can help interpret a conversation, organise context and draft
            possible directions. Its output may be incomplete or mistaken and
            should be checked against your circumstances.
          </p>
          <p>
            Professional review, commercial agreements and implementation
            approvals remain human decisions. Third-party integrations, costs
            and technical feasibility are confirmed for each engagement.
          </p>
          <p>
            Avoid sending passwords, confidential records or sensitive personal
            information in an initial enquiry.
          </p>
        </div>
      </section>
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
    </>
  );
}
