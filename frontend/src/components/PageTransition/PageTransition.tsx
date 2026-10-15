import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router";

// Animate the existing route DOM, without keys that remount session state.
export function PageTransition() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    // Session views already crossfade inside SessionPage.
    const session =
      /^\/(?:preview|sessions)\/([^/]+)\/(?:discovery|conversation|canvas|report)$/;
    const oldSession = from.match(session);
    const nextSession = pathname.match(session);
    if (
      from === pathname ||
      (oldSession && nextSession && oldSession[1] === nextSession[1]) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const page = document.querySelector(".app-shell > main");
    const animation = page?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 280,
      easing: "ease-out",
    });
    return () => animation?.cancel();
  }, [pathname]);
  return null;
}
