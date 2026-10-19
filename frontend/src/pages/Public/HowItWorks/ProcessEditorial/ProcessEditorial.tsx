import { steps } from "../../content";
import "./ProcessEditorial.css";
export function ProcessEditorial() {
  return (
    <section className="public-section process-editorial">
      <div>
        <h2>
          Clarity is
          <br />
          <span>a process.</span>
        </h2>
        <p>
          The platform can support exploration, context gathering and structured
          assessment. Consultant input and implementation are separate
          engagements, agreed with you.
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
  );
}
