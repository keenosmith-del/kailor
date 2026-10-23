// One publication inventory for header, footer and metadata.
export const sidebarPages = [
  ["/", "Home"],
  ["/how-it-works", "How it works"],
  ["/try-kailor", "Try it out"],
  [null, "Our Work"],
  [null, "Our Team"],
  ["/careers", "Careers"],
  ["/contact", "Contact"],
] as const;
export const links = sidebarPages.filter(([to]) => to !== null);
export const showClientPerspectives = import.meta.env.DEV;
export const sidebarSections = [
  ["hero", "Back to the beginning"],
  ["technologies", "Tools, platforms & expertise"],
  ["introduction", "Our experience & thinking"],
  ["services-overview", "Problems we help solve"],
  ["conversation", "From challenge to solution"],
  ["collaboration", "Inside your project workspace"],
  ["what-weve-built", "What we've built"],
  ...(showClientPerspectives
    ? [["client-feedback", "Client perspectives"]]
    : []),
  ["perspective", "How we choose solutions"],
  ["activity", "What we're building next"],
];
export const publicPaths = [
  "/",
  "/how-it-works",
  "/try-kailor",
  "/questions",
  "/faqs",
  "/careers",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
];

// Retired URLs redirect without becoming published pages or triggering account lookup.
export const retiredPublicPaths = ["/timeline", "/pricing"];
