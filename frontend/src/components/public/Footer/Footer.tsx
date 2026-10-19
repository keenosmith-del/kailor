import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { email } from "../../../pages/Public/content";
import { links } from "../navigation";
import "./Footer.css";
export function Footer() {
  return (
    <footer className="public-footer">
      <div className="footer-top">
        <Link className="footer-wordmark" to="/">
          kailor
        </Link>
        <p>
          Appropriate technology.
          <br />
          Thoughtfully put to work.
        </p>
      </div>
      <div className="footer-bottom">
        <a href={`mailto:${email}`}>
          {email} <ArrowUpRight size={14} />
        </a>
        <nav aria-label="Footer pages">
          {links.map(([to, label]) => (
            <Link to={to} key={to}>
              {label}
            </Link>
          ))}
        </nav>
        <span>© {new Date().getFullYear()} kailor</span>
      </div>
    </footer>
  );
}
