import { Link } from "react-router";
import { useConversation } from "../../../../components/public/ConversationModal/ConversationModal";
import { TimelineReveal } from "../TimelineReveal";
import "./TimelineClosing.css";
export function TimelineClosing() {
  const { openConversation } = useConversation();
  return (
    <section
      className="timeline-section timeline-closing"
      aria-labelledby="timeline-closing-title"
    >
      <TimelineReveal>
        <h2 className="timeline-section-heading" id="timeline-closing-title">
          There's more to build
        </h2>
      </TimelineReveal>
      <TimelineReveal>
        <p>
          The next chapter starts with the people, ideas and problems worth
          working on.
        </p>
      </TimelineReveal>
      <TimelineReveal>
        <div className="timeline-closing-actions">
          <button type="button" onClick={openConversation}>
            Start a conversation
          </button>
          <Link to="/how-it-works">How it works</Link>
        </div>
      </TimelineReveal>
    </section>
  );
}
