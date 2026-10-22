import { TimelineReveal } from "../TimelineReveal";
import "./TimelineHero.css";
export function TimelineHero() {
  return (
    <section className="timeline-hero" aria-labelledby="timeline-title">
      <div className="timeline-hero-copy">
        <TimelineReveal>
          <h1 id="timeline-title">
            The story
            <br />
            so far
          </h1>
        </TimelineReveal>
        <TimelineReveal>
          <p>
            kailor was founded in 2025, bringing together years of engineering
            experience and a belief that good technology begins with
            understanding the problem. Since then, that thinking has taken shape
            in the consultancy, the platform and the way we approach the work.
          </p>
        </TimelineReveal>
        <TimelineReveal>
          <span className="timeline-founded">Founded in 2025</span>
        </TimelineReveal>
      </div>
      <TimelineReveal className="timeline-year-frame">
        <span className="timeline-founding-year" aria-hidden="true">
          2025
        </span>
      </TimelineReveal>
    </section>
  );
}
