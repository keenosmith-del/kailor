import { TimelineReveal } from "../TimelineReveal";
import "./PresentAndBeyond.css";
export function PresentAndBeyond() {
  return (
    <section
      className="timeline-section timeline-present"
      aria-labelledby="timeline-present-title"
    >
      <TimelineReveal>
        <h2 className="timeline-section-heading" id="timeline-present-title">
          Still evolving
        </h2>
      </TimelineReveal>
      <div className="timeline-chapters">
        <TimelineReveal className="timeline-chapter-today">
          <div className="timeline-chapter">
            <span className="timeline-caption">Today</span>
            <h3>
              A foundation
              <br />
              already in place
            </h3>
            <p>
              The public website and authenticated customer application are
              built. Discovery, structured Analysis and the Solution Canvas
              connect understanding with considered options.
            </p>
            <p>
              Independent workspaces keep conversations, sources and report
              history together. Consultancy requests bring selected solutions
              and project context into review.
            </p>
          </div>
        </TimelineReveal>
        <TimelineReveal settle={0.2}>
          <div className="timeline-chapter">
            <span className="timeline-caption">Looking ahead</span>
            <h3>
              More to learn,
              <br />
              more to connect
            </h3>
            <p>
              The work continues through a better customer experience, stronger
              consultancy and engineering delivery, and useful extensions to
              integrations and platform functionality.
            </p>
            <p>
              A direction to build towards, shaped by the work and the people
              using it.
            </p>
          </div>
        </TimelineReveal>
      </div>
    </section>
  );
}
