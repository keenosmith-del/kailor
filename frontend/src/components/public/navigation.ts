// One publication inventory for header, footer and metadata.
export const sidebarPages = [
  ["/", "Home"],
  ["/how-it-works", "How it works"],
  ["/try-kailor", "Try it out"],
  [null, "Our Work"],
  [null, "Our Team"],
  [null, "kailor insider"],
  ["/careers", "Careers"],
  ["/contact", "Contact"],
] as const;
export const links = sidebarPages.filter((page) => page[0] !== null);
export const upcomingPages = sidebarPages.filter((page) => page[0] === null);
export const showClientPerspectives = import.meta.env.DEV;
export const sidebarSections = [
  ["hero", "Home"],
  ["introduction", "About"],
  ["services-overview", "Services"],
  ["conversation", "Getting started"],
  ["collaboration", "Working together"],
  ["perspective", "The wider picture"],
] as const;
export const footerSections = sidebarSections.filter(([id]) => id !== "hero");
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
