/** Evidence rules shared by Discovery and the living solution projection. No vendor claims. */
export const presenceCapabilities = [
  ["services", "Service information", /services?|offering/i],
  ["prices", "Prices", /prices?|pricing/i],
  [
    "coverage",
    "Service coverage areas",
    /areas? (?:I |we )?cover|service areas?|coverage/i,
  ],
  [
    "enquiries",
    "WhatsApp or contact-form enquiries",
    /whatsapp|contact form|enquir/i,
  ],
  [
    "responsive",
    "Mobile-friendly presentation",
    /mobile.friendly|mobile compatib|smartphone.*(?:website|site)/i,
  ],
  [
    "maintenance",
    "Easy content maintenance",
    /easy to maintain|maintain.*myself|content (?:updates|maintenance)|self.maint/i,
  ],
  [
    "branding",
    "Consistent visual branding",
    /same brand|consistent.*brand|brand.*consistent/i,
  ],
  [
    "booking",
    "Online appointment booking",
    /online (?:appointment )?booking|booking system/i,
  ],
  [
    "social-profile",
    "Instagram business profile setup",
    /instagram business (?:page|profile)|business instagram/i,
  ],
  [
    "social-photos",
    "Photographs for Instagram",
    /share.*photos?|grooming photographs/i,
  ],
  [
    "social-promotion",
    "Service promotion and local discovery",
    /promote.*services|attract local customers|local customer discovery/i,
  ],
] as const;
export function projectIntent(text: string) {
  const clauses = text.split(/\n+|(?<=[.!?;])\s+/).filter(Boolean);
  const negative =
    /(?:don['’]t|do not|not|never) (?:want|need)|no (?:complicated |custom )?(?:app|application)|can wait|useful later|not.*first version/i;
  const positive = (pattern: RegExp) =>
    clauses.some((c) => pattern.test(c) && !negative.test(c));
  return {
    prelaunch:
      /prepar.*launch|not launched|before launch|starting (?:a |my )?business/i.test(
        text,
      ),
    website: positive(/website|portfolio site/i),
    social: positive(/instagram|social.media (?:page|profile|presence)/i),
    application: positive(
      /(?:custom |web |mobile )?application|web app|software product/i,
    ),
    excludedApplication: clauses.some(
      (c) => /application|\bapp\b/i.test(c) && negative.test(c),
    ),
    deferredBooking: clauses.some(
      (c) =>
        /booking/i.test(c) &&
        /later|can wait|not.*(?:first|initial)|defer/i.test(c),
    ),
    operational: positive(
      /dispatch|proof of delivery|inventory|data entry|quality records|operational system/i,
    ),
  };
}
export function conciseSummary(text: string) {
  const first = text
    .trim()
    .match(/^.*?[.!?](?:\s|$)/)?.[0]
    ?.trim();
  if (first && first.length <= 220) return first;
  if (text.length <= 220) return text.trim();
  return "Review the objective and requirements in the solution details.";
}
export const meaningful = (items: string[]) => [
  ...new Set(items.map((s) => s.trim()).filter(Boolean)),
];
