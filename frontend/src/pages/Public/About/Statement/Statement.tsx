import { Sculpture } from "../../../../components/public/Sculpture/Sculpture";
import "./Statement.css";
export function Statement() {
  return (
    <section className="public-section about-statement">
      <div className="about-sculpture">
        <Sculpture />
      </div>
      <div>
        <h2>
          Appropriate
          <br />
          <span>by design.</span>
        </h2>
        <p>
          Not every idea needs an application. Not every workflow needs AI.
          Sometimes the most useful change is a simpler process or an existing
          tool, used well.
        </p>
        <p>
          We combine practical consulting with software, automation and cloud
          engineering to help you understand the options and make a sound
          decision.
        </p>
        <p>
          The platform supports that approach through conversation, structured
          discovery and assessment. It continues to evolve alongside the
          consultancy.
        </p>
      </div>
    </section>
  );
}
