import type {
  Answers,
  Evidence,
  FactClaim,
  DiscoveryConflict,
  KnowledgeFacet,
} from "../../shared/src/index.js";
export function clausesOf(text: string) {
  return text
    .replace(/[’]/g, "'")
    .split(/(?:[.!?]\s+|;\s*|\n+|\s+(?:but|however)\s+|\s+and (?=(?:I|we) ))/i)
    .map((s) => s.trim())
    .filter(Boolean);
}
function currentTechnology(clause: string, pattern: RegExp) {
  const match = pattern.exec(clause);
  if (!match) return false;
  const before = clause.slice(0, match.index);
  return (
    /^(?:existing|already|currently|our|my)\b/i.test(match[0]) ||
    !/\b(?:want|need|plan|intend|hope|would like)\b/i.test(before)
  );
}
export function claimsFromText(text: string, key: string): FactClaim[] {
  const claims: FactClaim[] = [];
  const add = (facet: KnowledgeFacet, value: string, quote: string) =>
    claims.push({ facet, value, key, quote });
  for (const clause of clausesOf(text)) {
    if (
      /\b(?:might|maybe|what if|hypothetically|whether|if I|used to|thinking about)\b/i.test(
        clause,
      )
    )
      continue;
    if (
      /\b(?:don't|do not|no longer) have (?:a |an? )?website|\b(?:closed|shut down|removed|took down) (?:that |my |our |the )?website|\bno website\b/i.test(
        clause,
      )
    )
      add("website", "absent", clause);
    else if (
      currentTechnology(
        clause,
        /\b(?:already have|have|has|existing|our|my) (?:a |an? )?website\b/i,
      ) &&
      !/\b(?:don't|do not|never|no longer)\b/i.test(clause)
    )
      add("website", "existing", clause);
    if (
      /\b(?:don't|do not|no longer) (?:have|use) (?:any |a )?(?:booking|scheduling) (?:system|software|provider|platform)|\bno (?:booking|scheduling) (?:system|software|provider|platform)/i.test(
        clause,
      )
    )
      add("booking", "absent", clause);
    else if (
      currentTechnology(
        clause,
        /\b(?:already use|already have|use|using|existing) (?:a |an? )?(?:booking|scheduling) (?:system|software|provider|platform)/i,
      )
    )
      add("booking", "existing", clause);
    for (const [facet, term] of [
      ["ai", "AI"],
      ["automation", "automat(?:ion|ing|e)"],
      ["websitePreference", "website"],
      ["appPreference", "(?:mobile app|web app|app|application)"],
    ] as const) {
      if (
        new RegExp(
          `\\b(?:don't|do not) (?:want|need) (?:any |a |an )?(?:${term})\\b|\\bno ${term}\\b`,
          "i",
        ).test(clause)
      )
        add(facet, "declined", clause);
      else if (
        new RegExp(
          `\\b(?:I|we) (?:want|need)(?: to)?[^.!?]*\\b${term}\\b`,
          "i",
        ).test(clause)
      )
        add(facet, "requested", clause);
    }
  }
  return claims;
}
export function claimsOf(a: Answers): FactClaim[] {
  const claims = Object.entries(a).flatMap(([key, v]) =>
    typeof v === "string"
      ? claimsFromText(v, key)
      : key === "presence" && v.includes("website")
        ? [
            {
              facet: "website" as const,
              value: "existing",
              key,
              quote: "Website selected as a current channel",
            },
          ]
        : [],
  );
  for (const [key, facet] of [
    ["websiteStatus", "website"],
    ["bookingStatus", "booking"],
    ["aiPreference", "ai"],
    ["automationPreference", "automation"],
    ["websitePreference", "websitePreference"],
    ["appPreference", "appPreference"],
  ] as const) {
    if (a[key] && a[key] !== "unknown")
      claims.push({ key, facet, value: String(a[key]), quote: String(a[key]) });
  }
  return claims;
}
export function resolvedFacets(evidence: Evidence[] = []) {
  const resolved: Partial<Record<KnowledgeFacet, string>> = {};
  for (const e of [...evidence].sort(
    (a, b) =>
      (a.provenance?.confirmedRevision ?? 0) -
      (b.provenance?.confirmedRevision ?? 0),
  ))
    if (e.active && e.status === "confirmed")
      Object.assign(resolved, e.provenance?.resolves ?? {});
  return resolved;
}
export function knowledgeConflicts(
  a: Answers,
  evidence: Evidence[] = [],
): DiscoveryConflict[] {
  const overrides = resolvedFacets(evidence),
    claims = claimsOf(a),
    result: DiscoveryConflict[] = [];
  for (const facet of [
    "website",
    "booking",
    "ai",
    "automation",
    "websitePreference",
    "appPreference",
  ] as const) {
    const found = claims.filter((c) => c.facet === facet);
    const previous = found[0],
      proposed = found.find((c) => c.value !== previous?.value);
    if (previous && proposed && !overrides[facet])
      result.push(conflict(previous, proposed));
  }
  return result;
}
function conflict(previous: FactClaim, proposed: FactClaim): DiscoveryConflict {
  return {
    id: `${proposed.facet}:${previous.key}:${proposed.key}`,
    facet: proposed.facet,
    kind: /actually|closed|no longer|changed my mind|now/i.test(proposed.quote)
      ? "correction"
      : "contradiction",
    previous,
    proposed,
    message: `Your information about ${proposed.facet === "websitePreference" ? "wanting a website" : proposed.facet} differs. Should the new information replace the earlier statement?`,
    material: true,
  };
}
export function detectUpdateConflicts(
  a: Answers,
  key: string,
  value: unknown,
  evidence: Evidence[] = [],
): DiscoveryConflict[] {
  const incoming = claimsOf({ [key]: value as Answers[string] }),
    old = claimsOf(a),
    overrides = resolvedFacets(evidence);
  const results: DiscoveryConflict[] = [];
  for (const claim of incoming) {
    const previous = old.find(
      (c) =>
        c.facet === claim.facet &&
        c.value === (overrides[claim.facet] ?? c.value),
    );
    if (previous && previous.value !== claim.value)
      results.push(conflict(previous, claim));
  }
  if (
    typeof value === "string" &&
    /fully custom|every feature|full.*mobile platform/i.test(value) &&
    /affordable|very inexpensive|small amount|limited budget/i.test(
      String(a.constraints ?? a.budget ?? ""),
    )
  )
    results.push({
      id: `scope_budget:${key}`,
      facet: "scope_budget",
      kind: "tradeoff",
      previous: {
        facet: "automation",
        value: "limited investment",
        key: "constraints",
        quote: String(a.constraints ?? a.budget),
      },
      proposed: {
        facet: "automation",
        value: "complex scope",
        key,
        quote: value,
      },
      message:
        "A broad custom platform may conflict with the small initial investment. Can we scope a smaller first version?",
      material: false,
    });
  return results.filter(
    (c, i, list) => list.findIndex((x) => x.id === c.id) === i,
  );
}
export function applyResolvedFacets(
  a: Answers,
  evidence: Evidence[] = [],
): Answers {
  const result = { ...a },
    overrides = resolvedFacets(evidence);
  const all = claimsOf(a);
  for (const facet of [
    "website",
    "booking",
    "ai",
    "automation",
    "websitePreference",
    "appPreference",
  ] as const) {
    const values = [
      ...new Set(all.filter((c) => c.facet === facet).map((c) => c.value)),
    ];
    const value =
      overrides[facet] ?? (values.length === 1 ? values[0] : undefined);
    const key = {
      website: "websiteStatus",
      booking: "bookingStatus",
      ai: "aiPreference",
      automation: "automationPreference",
      websitePreference: "websitePreference",
      appPreference: "appPreference",
    }[facet];
    if (value) result[key] = value;
  }
  if (result.websiteStatus === "absent" && Array.isArray(result.presence))
    result.presence = result.presence.filter((p) => p !== "website");
  if (result.websiteStatus === "existing")
    result.presence = [
      ...new Set([
        ...(Array.isArray(result.presence)
          ? result.presence.filter((p) => p !== "none")
          : []),
        "website",
      ]),
    ];
  return result;
}

export function currentCorrections(a: Answers, evidence: Evidence[] = []) {
  const overrides = resolvedFacets(evidence),
    claims = claimsOf(a);
  return Object.entries(overrides).flatMap(([facet, value]) => {
    const previousKeys = [
      ...new Set(
        claims
          .filter((c) => c.facet === facet && c.value !== value)
          .map((c) => c.key),
      ),
    ];
    const source = [...evidence]
      .reverse()
      .find(
        (e) =>
          e.active &&
          e.status === "confirmed" &&
          e.provenance?.resolves?.[facet as KnowledgeFacet] === value,
      );
    return previousKeys.length && source
      ? [
          {
            facet: facet as KnowledgeFacet,
            currentValue: value,
            sourceEvidenceId: source.id,
            previousKeys,
          },
        ]
      : [];
  });
}
