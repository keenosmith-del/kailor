import { Link } from "react-router";
import { ArrowUpRight, Sparkles, MoveUpRight, Puzzle } from "lucide-react";
import "./ClientJourneys.css";
const journeys = [
  {
    title: "Starting something new",
    icon: Sparkles,
    copy: "An idea, an emerging business, or simply a question about where to begin.",
    detail:
      "Example: turn a broad idea into a small, testable first step. Clarify who it helps, what you need to learn and which existing tools could be enough.",
    path: "An idea → a clearer question → a practical first step",
  },
  {
    title: "Improving an existing business",
    icon: MoveUpRight,
    copy: "Less administration. Fewer disconnected tools. A process that fits your day.",
    detail:
      "Example: map how enquiries become bookings and follow-ups. Identify duplicated work, compare suitable platforms and agree a manageable improvement.",
    path: "A daily friction → a workflow map → a focused improvement",
  },
  {
    title: "Building a technical solution",
    icon: Puzzle,
    copy: "A specific requirement that needs considered design and sound engineering.",
    detail:
      "Example: explore an operational web application. Define essential records, users and integrations, then assess feasibility before agreeing delivery.",
    path: "A requirement → feasible options → an agreed scope",
  },
];
export function ClientJourneys() {
  return (
    <section className="public-section home-journeys">
      <div className="section-prelude">
        <span>Your starting point</span>
      </div>
      <h2>
        Where are <span>you now?</span>
      </h2>
      <div className="journey-grid">
        {journeys.map((j, i) => {
          const Icon = j.icon;
          return (
            <article className={`journey-tile journey-${i}`} key={j.title}>
              <div className="journey-geometry" aria-hidden="true">
                <i />
                <i />
                <i />
                <Icon size={34} strokeWidth={1} />
              </div>
              <h3>{j.title}</h3>
              <p>{j.copy}</p>
              <details>
                <summary>
                  See a possible journey <ArrowUpRight size={17} />
                </summary>
                <p>{j.detail}</p>
                <span className="journey-path">{j.path}</span>
                <Link to="/how-it-works" className="pub-text-link">
                  Understand the process <ArrowUpRight size={16} />
                </Link>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
