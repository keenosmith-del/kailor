import { ConversationVisual } from "../../../../components/public/ConversationVisual/ConversationVisual";
import "./Conversation.css";

export function Conversation() {
  return (
    <section
      className="public-section home-conversation"
      id="conversation"
      aria-labelledby="conversation-title"
    >
      <div className="conversation-intro">
        <h2 id="conversation-title">
          It starts with
          <br />a conversation
        </h2>

        <p>
          Tell kailor what you're trying to achieve or what isn't working. We'll
          help uncover the real challenge, understand your existing processes
          and explore a practical way forward.
        </p>
      </div>

      <ConversationVisual />
    </section>
  );
}
