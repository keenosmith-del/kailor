// One publication inventory for header, footer and metadata.
export const sidebarPages = [
  ["/", "Home"],
  ["/how-it-works", "How it works"],
  ["/try-kailor", "Try kailor"],
  [null, "Our Work"],
  [null, "Our Team"],
  ["/timeline", "Timeline"],
  ["/pricing", "Pricing"],
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
  "/timeline",
  "/pricing",
  "/questions",
  "/faqs",
  "/careers",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
];
