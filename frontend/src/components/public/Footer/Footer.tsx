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

export function Footer() {
  return (
    <footer className="public-footer" id="footer">
      <div className="public-footer__main">
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
        <span>© 2025 kailor</span>
        <span>{email}</span>
      </div>
    </footer>
  );
}
