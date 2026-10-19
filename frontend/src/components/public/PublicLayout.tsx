import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { email } from "../../pages/Public/content";
import "./Public.css";
const links = [
  ["/services", "Services"],
  ["/how-it-works", "How it works"],
  ["/about", "About"],
  ["/pricing", "Pricing"],
  ["/contact", "Contact"],
];
const meta: Record<string, [string, string]> = {
  "/": [
    "Technology, thoughtfully tailored.",
    "Founder-led technology consulting, software engineering, AI and automation. Practical decisions and considered solutions with kailor.",
  ],
  "/services": [
    "Services",
    "Explore software engineering, AI, business automation, cloud infrastructure and technology consulting with kailor.",
  ],
  "/how-it-works": [
    "How it works",
    "From discovery and understanding to analysis, recommendations and a separately agreed implementation.",
  ],
  "/about": [
    "About kailor",
    "A founder-led technology consultancy focused on appropriate technology, sound engineering and thoughtful decisions.",
  ],
  "/pricing": [
    "Ways to work together",
    "Explore kailor engagement options. Guided assessments and custom engineering are scoped and quoted individually.",
  ],
  "/contact": [
    "Let's talk",
    "Contact kailor about an idea, an existing business or a specific technical project.",
  ],
};
export function PublicLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    setOpen(false);
    const publicPath = location.pathname.replace(/\/+$/, "") || "/";
    const [title, description] = meta[publicPath] || meta["/"];
    document.title = `${title} — kailor`;
    for (const [name, content] of [
      ["description", description],
      ["og:title", document.title],
      ["og:description", description],
      ["og:url", `https://kailor.co.za${publicPath}`],
    ]) {
      const selector = name.startsWith("og:") ? "property" : "name";
      let el = document.head.querySelector<HTMLMetaElement>(
        `meta[${selector}="${name}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(selector, name);
        document.head.append(el);
      }
      el.content = content;
    }
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = `https://kailor.co.za${publicPath}`;
    const frame = requestAnimationFrame(() => {
      if (location.hash)
        document
          .getElementById(decodeURIComponent(location.hash.slice(1)))
          ?.scrollIntoView();
      else window.scrollTo({ top: 0, behavior: "instant" });
      main.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <div className="public-site">
      <a href="#public-main" className="public-skip">
        Skip to content
      </a>
      <header className="public-header">
        <Link to="/" className="public-brand" aria-label="kailor home">
          kailor
        </Link>
        <nav className="public-desktop-nav" aria-label="Public pages">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="public-header-actions">
          <Link className="pub-pill header-sign-in" to="/sign-in">
            Sign in <ArrowUpRight size={14} />
          </Link>
          <button
            ref={toggle}
            className="pub-icon public-menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav
          ref={nav}
          id="public-mobile-menu"
          className="public-mobile-nav"
          hidden={!open}
          aria-label="Mobile public pages"
        >
          {links.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
              <ArrowUpRight size={18} />
            </NavLink>
          ))}
        </nav>
      </header>
      <main ref={main} id="public-main" tabIndex={-1}>
        <Outlet />
      </main>
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
    </div>
  );
}
