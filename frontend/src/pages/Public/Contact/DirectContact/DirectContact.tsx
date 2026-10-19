import { useState } from "react";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { email, mail } from "../../content";
import "./DirectContact.css";
export function DirectContact() {
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
  );
}
