import { ProcessReveal } from "../ProcessReveal";
import { FileCheck2 } from "lucide-react";
import "./ConsultancyProgress.css";
export function ConsultancyProgress() {
  return (
    <section
      className="hiw-editorial-section hiw-consultancy-section"
      aria-labelledby="hiw-consultancy-title"
    >
      <div className="hiw-editorial-copy">
        <ProcessReveal>
          <h2 id="hiw-consultancy-title">
            When the plan is agreed, the work can begin
          </h2>
        </ProcessReveal>
        <ProcessReveal>
          <p>
            Review the solutions, request consultancy and work through the
            requirements with a person. Scope and a proposal are agreed before
            implementation is commissioned separately.
          </p>
        </ProcessReveal>
        <ProcessReveal>
          <p>
            Once work begins, the relevant project workspace keeps decisions,
            consultant correspondence and progress together. Each project has
            its own context, so the work stays organised.
          </p>
        </ProcessReveal>
      </div>
      <div className="hiw-consultant-visual">
        <p className="hiw-caption">
          Illustrative workspace · After scope agreement
        </p>
        <ProcessReveal>
          <div className="hiw-project-card">
            <div className="hiw-project-heading">
              <FileCheck2 size={23} strokeWidth={1.3} aria-hidden="true" />
              <span className="hiw-review-status">In progress</span>
            </div>
            <h3>Order &amp; stock workflow</h3>
            <dl>
              <dt>Current work</dt>
              <dd>
                Reviewing how orders are recorded and where stock quantities are
                updated.
              </dd>
              <dt>Next review</dt>
              <dd>Confirm the source of truth for stock quantities.</dd>
            </dl>
          </div>
        </ProcessReveal>
        <ProcessReveal className="hiw-consultant-update-reveal" settle={0.22}>
          <div className="hiw-consultant-update">
            <img src="/mascot-head.png" alt="" width={36} height={36} />
            <div>
              <span>Consultant update</span>
              <p>
                I've mapped the current flow. Next, we'll check which systems
                can exchange updates before choosing the integration approach.
              </p>
            </div>
          </div>
        </ProcessReveal>
      </div>
    </section>
  );
}
