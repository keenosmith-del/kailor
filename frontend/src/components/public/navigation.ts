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
  ["hero", "Home"],
  ["technologies", "Technology"],
  ["introduction", "About"],
  ["services-overview", "Services"],
  ["conversation", "Conversation"],
  ["collaboration", "Collaboration"],
  ["what-weve-built", "What we've built"],
  ...(showClientPerspectives
    ? [["client-feedback", "Client perspectives"]]
    : []),
  ["perspective", "Our approach"],
  ["activity", "In motion"],
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
