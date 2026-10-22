import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";
import { applyPageMetadata } from "./metadata";
export function usePublicPage() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const main = useRef<HTMLElement>(null);
  const previous = useRef(location.key);
  useEffect(() => {
    document.documentElement.classList.remove("no-js");
    const path = location.pathname.replace(/\/+$/, "") || "/";
    applyPageMetadata(path);
    const changed = previous.current !== location.key;
    previous.current = location.key;
    let observer: MutationObserver | undefined;
    let frame = 0;
    const scroll = () => {
      if (location.hash) {
        let id: string;
        try {
          id = decodeURIComponent(location.hash.slice(1));
        } catch {
          return true;
        }
        const target = document.getElementById(id);
        if (!target) return false;
        target.scrollIntoView({ behavior: "instant", block: "start" });
      } else if (changed && navigationType !== "POP")
        window.scrollTo({ top: 0, behavior: "instant" });
      if (changed) main.current?.focus({ preventScroll: true });
      return true;
    };
    // Lazy children may not yet be committed on initial hash entry or route return.
    frame = requestAnimationFrame(() => {
      if (!scroll()) {
        observer = new MutationObserver(() => {
          if (scroll()) observer?.disconnect();
        });
        observer.observe(main.current || document.body, {
          childList: true,
          subtree: true,
        });
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [location.key, location.pathname, location.hash, navigationType]);
  return main;
}
