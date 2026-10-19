import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Sculpture } from "../../../components/public/Visuals";
import "./About.css";
export default function About() {
  return (
    <>
      <header className="public-page-hero">
        <span>About kailor</span>
        <h1>
          Good questions.
          <br />
          <span>Considered engineering.</span>
        </h1>
        <p>
          kailor is a founder-led technology consultancy and an evolving
          AI-supported platform. Built on a simple idea: technology should make
          sense for the person using it.
        </p>
      </header>
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
      <section className="public-section about-principles">
        <h2>
          How we
          <br />
          <span>think about the work.</span>
        </h2>
        <div>
          {[
            [
              "Understand before prescribing.",
              "Your goals, constraints and existing systems come before a technology choice.",
            ],
            [
              "Make the trade-offs visible.",
              "Explain why an option may fit, what remains uncertain and what needs checking.",
            ],
            [
              "Build only what earns its place.",
              "Prefer the smallest useful solution. Consider existing platforms before adding custom software.",
            ],
            [
              "Keep responsibility clear.",
              "AI assistance supports the process. Professional judgement and explicit agreement guide the work.",
            ],
          ].map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="public-section about-founder">
        <span>Founder-led, personally considered</span>
        <h2>
          A direct conversation.
          <br />
          <span>A practical point of view.</span>
        </h2>
        <p>
          kailor is led by Keeno Smith. Enquiries begin directly with the
          founder, so we can understand what you're working towards and whether
          there is a useful fit.
        </p>
        <Link className="pub-pill pub-pill-dark" to="/contact">
          Get in touch <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}
