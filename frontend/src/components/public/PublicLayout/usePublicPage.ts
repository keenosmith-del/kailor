import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
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
  "/work": [
    "Our work",
    "Explore kailor's technology project concepts and selected work across software engineering, AI, automation and business intelligence.",
  ],
};
export function usePublicPage() {
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const publicPath = location.pathname.replace(/\/+$/, "") || "/";
    const [, description] = meta[publicPath] || meta["/"];
    document.title = "kailor";
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
  return main;
}
