import { useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { email, mail } from "../content";
import "./Contact.css";
export default function Contact() {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus("Email address copied.");
    } catch {
      setStatus(
        "Select and copy the email address below, or open the email link.",
      );
    }
  }
  return (
    <>
      <header className="public-page-hero contact-hero">
        <span>Let's talk</span>
        <h1>
          What's
          <br />
          <span>on your mind?</span>
        </h1>
        <p>
          An early idea. An inefficient process. A specific engineering
          challenge. Tell us a little about it and we'll take the conversation
          from there.
        </p>
      </header>
      <section className="public-section contact-direct">
        <div>
          <span>Direct to the founder</span>
          <a
            className="contact-email"
            href={mail("An introduction to my project")}
          >
            {email}
            <ArrowUpRight size={28} />
          </a>
          <div className="actions">
            <a
              className="pub-pill pub-pill-dark"
              href={mail("Let's talk about technology")}
            >
              Write an email <ArrowUpRight size={16} />
            </a>
            <button className="pub-pill" onClick={() => void copy()}>
              {status.startsWith("Email") ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
              Copy address
            </button>
          </div>
          <p role="status" className="contact-status">
            {status}
          </p>
        </div>
        <aside>
          <h2>A useful starting point</h2>
          <ul>
            <li>What are you working on?</li>
            <li>What would you like to improve or understand?</li>
            <li>Are there existing tools, constraints or timelines?</li>
          </ul>
          <p>
            A few sentences are enough to begin. Please leave passwords and
            sensitive personal or business records out of your initial email.
          </p>
        </aside>
      </section>
      <section className="public-section contact-links">
        <h2>
          A little context
          <br />
          <span>before we speak.</span>
        </h2>
        <div>
          <Link to="/services">
            Explore the services <ArrowUpRight size={20} />
          </Link>
          <Link to="/how-it-works">
            Understand the process <ArrowUpRight size={20} />
          </Link>
          <Link to="/pricing">
            Ways to work together <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
