import { Link } from "react-router";
import "./Work.css";

export default function Work() {
  return (
    <section className="work-page">
      <span>kailor / work</span>

      <h1>
        Our work
        <span className="kailor-round-dot" aria-hidden="true" />
      </h1>

      <p>
        We're putting together a closer look at the projects, technical thinking
        and solutions behind kailor.
      </p>

      <Link to="/#work">Back to selected work</Link>
    </section>
  );
}
