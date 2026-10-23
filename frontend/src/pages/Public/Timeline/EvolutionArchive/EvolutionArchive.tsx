// Timeline remains recoverable; the live gallery and its behaviour now have one owner.
import { CapabilityGallery } from "../../Home/WhatWeveBuilt/WhatWeveBuilt";
import type { TimelineDetailContent } from "../timelineData";
export function EvolutionArchive({
  onSelect,
}: {
  onSelect: (value: TimelineDetailContent) => void;
}) {
  return <CapabilityGallery id="timeline-archive" onSelect={onSelect} />;
}
