import { Link } from "react-router";
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
          ask the right questions, understand your challenges and explore
          solutions that make sense for you — whether that's improving what you
          already have or building something entirely new.
        </p>
        <Link
          className="pub-pill pub-pill-dark conversation-try-action"
          to="/try-kailor"
        >
          Try it out
        </Link>
      </div>

      <ConversationVisual />
    </section>
  );
}
