import type { ConsultingBrief } from "../../shared/src/consulting.js";

// A structured context projection: never truncate serialised JSON midway through
// priorities or decisions to make space for repeated evidence quotes.
export function consultingContext(brief?: ConsultingBrief) {
  if (!brief) return null;
  return {
    summary: brief.summary,
    requirements: brief.requirements?.map((r) => ({
      id: r.id,
      label: r.label,
      priority: r.priority,
      conflict: r.conflict,
      sources: [...new Set(r.provenance.map((p) => p.sourceKey))],
    })),
    decisions: brief.decisions.map((d) => ({
      title: d.title,
      status: d.status,
      notes: d.notes.slice(0, 300),
    })),
    directions: brief.directions
      .slice(0, 3)
      .map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        why: d.why,
        requirements: d.requirements,
        firstStep: d.firstStep,
        risks: d.risks,
        validation: d.validation,
        costToTest: d.costToTest,
      })),
    unknowns: brief.unknowns,
    facts: brief.facts
      .slice(0, 6)
      .map((f) => ({ id: f.id, sourceKey: f.sourceKey, value: f.value })),
  };
}
