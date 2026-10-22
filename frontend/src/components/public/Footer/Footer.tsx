import { Link } from "react-router";

import "./Footer.css";

const email = "keenosmith@kailor.co.za";

import { links, sidebarSections } from "../navigation";
import { CookiePreferences } from "../CookiePreferences/CookiePreferences";
const siteLinks = links.filter(([to]) => to !== "/");
const homepageLinks = sidebarSections
  .filter(([id]) =>
    [
      "introduction",
      "conversation",
      "collaboration",
      "client-feedback",
    ].includes(id),
  )
  .map(([id, label]) => [`/#${id}`, label]);

export function Footer() {
  return (
    <footer className="public-footer" id="footer">
      <div className="public-footer__main">
        <div className="public-footer__directory">
          <nav aria-label="Explore kailor">
            <h2>Explore</h2>
            {siteLinks.map(([to, label]) => (
              <Link key={to} to={to!}>
                {label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Homepage sections">
            <h2>On this page</h2>
            {homepageLinks.map(([to, label]) => (
              <Link key={to} to={to!}>
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
        <span>
          © 2025
          {new Date().getFullYear() > 2025
            ? `–${new Date().getFullYear()}`
            : ""}{" "}
          kailor
        </span>
        <a href={`mailto:${email}`}>{email}</a>
        <div className="public-footer__legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cookies">Cookie information</Link>
          <CookiePreferences />
        </div>
      </div>
    </footer>
  );
}
