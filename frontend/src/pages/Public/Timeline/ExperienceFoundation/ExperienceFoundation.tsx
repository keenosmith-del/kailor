import { TimelineReveal } from "../TimelineReveal";
import "./ExperienceFoundation.css";
export function ExperienceFoundation() {
  return (
    <section
      className="timeline-section timeline-experience"
      aria-labelledby="timeline-experience-title"
    >
      <div>
        <TimelineReveal>
          <h2
            className="timeline-section-heading"
            id="timeline-experience-title"
          >
            The experience
            <br />
            came first
          </h2>
        </TimelineReveal>
        <TimelineReveal>
          <p>
            Before kailor had a name, the work was already taking shape across
            software engineering, cloud systems, automation and artificial
            intelligence. Those disciplines now come together in a consultancy
            built around understanding, designing and engineering practical
            solutions.
          </p>
        </TimelineReveal>
      </div>
      <TimelineReveal className="timeline-experience-figure">
        <span className="timeline-years">6+</span>
        <p>
          Years of engineering experience
          <br />
          <span>Experience that predates kailor, founded in 2025</span>
        </p>
      </TimelineReveal>
      <TimelineReveal className="timeline-disciplines">
        <div>
          <span>Software engineering</span>
          <span>Cloud infrastructure</span>
          <span>Artificial intelligence</span>
          <span>Automation and integration</span>
        </div>
      </TimelineReveal>
    </section>
  );
}
