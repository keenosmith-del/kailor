import { BrandWordmark } from "../../BrandWordmark/BrandWordmark";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, ChevronDown } from "lucide-react";

import { sidebarPages, sidebarSections } from "../navigation";

import { useConversation } from "../ConversationModal/ConversationModal";

import "./Header.css";

export function Header() {
  const location = useLocation();

  const { openConversation } = useConversation();

  const [open, setOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(true);
  const [hidden, setHidden] = useState(false);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;

    menuRef.current
      ?.querySelector<HTMLAnchorElement>("a")
      ?.focus({ preventScroll: true });

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

  useEffect(() => {
    let previousY = Math.max(0, window.scrollY);
    let direction = 0;
    let distance = 0;

    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - previousY;

      previousY = currentY;

      if (open || currentY < 90) {
        setHidden(false);
        direction = 0;
        distance = 0;
        return;
      }

      if (Math.abs(delta) < 1) return;

      const nextDirection = delta > 0 ? 1 : -1;

      distance =
        nextDirection === direction
          ? distance + Math.abs(delta)
          : Math.abs(delta);

      direction = nextDirection;

      if (direction === 1 && distance >= 24) {
        setHidden(true);
        distance = 0;
      }

      if (direction === -1 && distance >= 10) {
        setHidden(false);
        distance = 0;
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [open]);

  const openFromSidebar = () => {
    setOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
    openConversation();
  };

  return (
    <>
      <header className={`public-header${hidden && !open ? " is-hidden" : ""}`}>
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
            <Menu size={17} strokeWidth={1.5} />
          </button>

          <BrandWordmark className="public-brand-wordmark" />
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
        <div className="public-mobile-nav__group">
          <h2>Pages</h2>

          {sidebarPages.map(([to, label]) =>
            to === null ? (
              <span key={label} aria-disabled="true">
                {label}
              </span>
            ) : (
              <NavLink key={label} to={to!} end onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ),
          )}
        </div>

        <div className="public-mobile-nav__group">
          <h2>
            <button
              className="public-sections-toggle"
              type="button"
              aria-expanded={sectionsOpen}
              aria-controls="homepage-section-links"
              onClick={() => setSectionsOpen((value) => !value)}
            >
              On the homepage
              <ChevronDown size={13} aria-hidden="true" />
            </button>
          </h2>
          <div
            className="public-section-links"
            id="homepage-section-links"
            data-expanded={sectionsOpen}
            inert={!sectionsOpen}
            aria-hidden={!sectionsOpen}
          >
            <div>
              {sidebarSections.map(([id, label]) => (
                <Link
                  key={id}
                  to={`/#${id}`}
                  onClick={() => {
                    setOpen(false);

                    if (
                      location.pathname === "/" &&
                      location.hash === `#${id}`
                    ) {
                      document.getElementById(id)?.scrollIntoView({
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "instant"
                          : "smooth",
                        block: "start",
                      });
                    }
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="public-mobile-nav__bottom">
          <Link
            className="sidebar-white"
            to="/create-account"
            onClick={() => setOpen(false)}
          >
            <img src="/svgs/profile.svg" width={17} height={17} alt="" />
            Create account
          </Link>
          <div className="sidebar-action-row">
            <Link
              className="sidebar-white"
              to="/sign-in"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <button type="button" onClick={openFromSidebar}>
              Start conversation
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
