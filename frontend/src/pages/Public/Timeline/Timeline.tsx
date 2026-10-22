import { useState } from "react";
import { PageBack } from "../../../components/public/PageBack/PageBack";
import { TimelineHero } from "./TimelineHero/TimelineHero";
import { MilestoneTimeline } from "./MilestoneTimeline/MilestoneTimeline";
import { ExperienceFoundation } from "./ExperienceFoundation/ExperienceFoundation";
import { EvolutionArchive } from "./EvolutionArchive/EvolutionArchive";
import { PresentAndBeyond } from "./PresentAndBeyond/PresentAndBeyond";
import { TimelineClosing } from "./TimelineClosing/TimelineClosing";
import { TimelineDetail } from "./TimelineDetail";
import type { TimelineDetailContent } from "./timelineData";
import "./Timeline.css";
export default function Timeline() {
  const [detail, setDetail] = useState<TimelineDetailContent | null>(null);
  return (
    <div className="company-timeline-page">
      <div className="timeline-back">
        <PageBack />
      </div>
      <TimelineHero />
      <MilestoneTimeline onSelect={setDetail} />
      <ExperienceFoundation />
      <EvolutionArchive onSelect={setDetail} />
      <PresentAndBeyond />
      <TimelineClosing />
      {detail && (
        <TimelineDetail content={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
