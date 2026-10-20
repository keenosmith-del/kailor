import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { links } from "../navigation";
import "./Header.css";

export function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;

    // Move keyboard focus into the opened navigation.
    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (
        !menuRef.current?.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [open]);

  return (
    <>
      <header className="public-header">
        <div className="public-brand">
          <img src="/kailor-head.png" alt="" width={28} height={28} />

          <button
            ref={toggleRef}
            type="button"
            className="public-menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            onClick={() => setOpen((previous) => !previous)}
          >
            <Menu size={15} />
          </button>

          <Link
            to="/"
            className="public-brand-wordmark"
            aria-label="kailor home"
          >
            kailor
          </Link>
        </div>

        <div className="public-header-actions">
          <Link to="/sign-in" className="pub-pill header-sign-in">
            <img src="/svgs/profile.svg" alt="" width={17} height={17} />
            <span>Sign in</span>
          </Link>

          <Link to="/create-account" className="pub-pill header-create-account">
            Create account
          </Link>
        </div>
      </header>

      <nav
        ref={menuRef}
        id="public-mobile-menu"
        className={`public-mobile-nav${open ? " is-open" : ""}`}
        aria-label="Main navigation"
        aria-hidden={!open}
        inert={!open}
      >
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}>
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
