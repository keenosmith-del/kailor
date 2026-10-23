// Retained compatibility adapter for the disconnected Timeline page.
import { CapabilityDetail } from "../Home/WhatWeveBuilt/CapabilityDetail";
import type { TimelineDetailContent } from "./timelineData";
export function TimelineDetail({
  content,
  onClose,
}: {
  content: TimelineDetailContent;
  onClose: () => void;
}) {
  return (
    <CapabilityDetail
      content={content}
      onClose={onClose}
      closeLabel="Close timeline detail"
    />
  );
}
