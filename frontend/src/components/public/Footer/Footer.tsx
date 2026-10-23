import { Link } from "react-router";

import "./Footer.css";

const email = "keenosmith@kailor.co.za";

import { links, footerSections, upcomingPages } from "../navigation";
import { CookiePreferences } from "../CookiePreferences/CookiePreferences";
import { useConversation } from "../ConversationModal/ConversationModal";

export function Footer() {
  const { openConversation } = useConversation();
  return (
    <footer className="public-footer" id="footer">
      <div className="public-footer__main">
        <div className="public-footer__directory">
          <nav aria-label="Explore kailor">
            <h2>Pages</h2>
            {links.map(([to, label]) => (
              <Link key={label} to={to}>
                {label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Homepage sections">
            <h2>On the homepage</h2>
            {footerSections.map(([id, label]) => (
              <Link key={id} to={`/#${id}`}>
                {label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Get started">
            <h2>Get started</h2>
            <Link to="/create-account">Create account</Link>
            <Link to="/sign-in">Sign in</Link>
            <Link to="/questions">Common questions</Link>
            <button
              type="button"
              aria-label="Start conversation from footer"
              onClick={openConversation}
            >
              Start conversation
            </button>
          </nav>
          <nav aria-label="More from kailor">
            <h2>More from kailor</h2>
            {upcomingPages.map(([, label]) => (
              <span key={label} aria-disabled="true">
                {label}
              </span>
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
        <span>© 2025 kailor. All Rights Reserved.</span>
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
