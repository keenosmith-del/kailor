import type { FormEvent } from "react";
import { Link } from "react-router";

import "./Footer.css";

const email = "keenosmith@kailor.co.za";

const siteLinks = [
  ["/services", "Services"],
  ["/work", "What we've built"],
  ["/how-it-works", "How it works"],
  ["/about", "About kailor"],
  ["/pricing", "Pricing"],
  ["/contact", "Contact"],
] as const;

const homepageLinks = [
  ["/#introduction", "Why kailor"],
  ["/#conversation", "Conversation"],
  ["/#collaboration", "Collaboration"],
  ["/#consultants", "Our consultants"],
  ["/#client-feedback", "Client perspectives"],
] as const;

function composeEnquiry(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const sender = String(data.get("email") ?? "").trim();
  const subject = String(data.get("subject") ?? "").trim();
  if (!sender || !subject) return;

  const body = `Hello kailor,\n\n\n\nFrom: ${sender}`;
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function Footer() {
  return (
    <footer className="public-footer" id="footer">
      <div className="public-footer__main">
        <div className="public-footer__enquiry">
          <h2>Something in mind?</h2>
          <p>Tell us where you'd like to begin.</p>

          <form className="public-footer__form" onSubmit={composeEnquiry}>
            <label htmlFor="public-footer-email">Email</label>
            <input
              id="public-footer-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />

            <label htmlFor="public-footer-subject">Subject</label>
            <input
              id="public-footer-subject"
              name="subject"
              type="text"
              placeholder="Tell us what it's about"
              maxLength={140}
              required
            />

            <button type="submit">Send</button>
            <p className="public-footer__form-note">
              Opens your email application to complete the message.
            </p>
          </form>
        </div>

        <div className="public-footer__directory">
          <nav aria-label="Explore kailor">
            <h2>Explore</h2>
            {siteLinks.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Homepage sections">
            <h2>On this page</h2>
            {homepageLinks.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="public-footer__identity">
          <p className="public-footer__tagline">
            Appropriate technology.
            <br />
            Thoughtfully put to work.
          </p>
          <div className="public-footer__signature">
            <img
              className="public-footer__mascot"
              src="/mascot/other/kailor-hiding.png"
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <Link className="footer-wordmark" to="/" aria-label="kailor home">
              kailor
            </Link>
          </div>
        </div>
      </div>

      <div className="public-footer__bottom">
        <span>© {new Date().getFullYear()} kailor</span>
        <a href={`mailto:${email}`}>{email}</a>
        <Link to="/">Back to top</Link>
      </div>
    </footer>
  );
}
