import routes from "./routes.json";
export const origin = "https://kailor.co.za";
export function applyPageMetadata(path: string) {
  const page = (
    routes as Record<
      string,
      { title: string; description: string; index: boolean }
    >
  )[path] || {
    title: "Workspace | kailor",
    description: "Private kailor workspace.",
    index: false,
  };
  document.title = page.title;
  for (const [name, content] of Object.entries({
    description: page.description,
    robots: page.index ? "index, follow" : "noindex, nofollow",
    "og:type": "website",
    "og:site_name": "kailor",
    "og:title": page.title,
    "og:description": page.description,
    "og:url": origin + path,
    "og:image": origin + "/social/kailor.png",
    "og:image:width": "1200",
    "og:image:height": "630",
    "twitter:card": "summary_large_image",
    "twitter:title": page.title,
    "twitter:description": page.description,
    "twitter:image": origin + "/social/kailor.png",
  })) {
    const attribute = name.startsWith("og:") ? "property" : "name";
    let element = document.head.querySelector<HTMLMetaElement>(
      `meta[${attribute}="${name}"]`,
    );
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, name);
      document.head.append(element);
    }
    element.content = content;
  }
  let canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = origin + path;
}
