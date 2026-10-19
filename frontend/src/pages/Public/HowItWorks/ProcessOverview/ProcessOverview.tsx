import { ProcessTimeline } from "../../../../components/public/ProcessTimeline/ProcessTimeline";
import "./ProcessOverview.css";
export function ProcessOverview() {
  return (
    <section className="public-section process-page-diagram">
      <h2 className="sr-only">The process at a glance</h2>
      <ProcessTimeline full />
    </section>
  );
}
