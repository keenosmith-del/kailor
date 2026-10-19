import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { links } from "../navigation";
import "./Header.css";
export function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 24 || location.pathname !== "/");
    };

    update();

    window.addEventListener("scroll", update, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", update);
    };
  }, [location.pathname]);

  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
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
    <header className={`public-header${scrolled ? " is-scrolled" : ""}`}>
      <Link to="/" className="public-brand" aria-label="kailor home">
        kailor.
      </Link>
      <nav className="public-desktop-nav" aria-label="Public pages">
        {links
          .filter(([to]) => to === "/services" || to === "/about")
          .map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="public-header-actions">
        <Link className="pub-pill header-sign-in" to="/sign-in">
          Sign in
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
  );
}
