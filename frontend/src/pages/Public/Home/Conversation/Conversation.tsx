import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { ConversationVisual } from "../../../../components/public/ConversationVisual/ConversationVisual";
import { MediaSection } from "../../../../components/public/MediaSection/MediaSection";
import { media } from "../../media";
import "./Conversation.css";
export function Conversation() {
  return (
    <section className="public-section home-conversation" id="conversation">
      <div className="conversation-intro">
        <span>A conversation with kailor</span>
        <h2>
          Start with
          <br />
          what's <span>on your mind.</span>
        </h2>
        <p>
          You don't need a technical brief to begin. A good conversation can
          uncover the question worth answering.
        </p>
        <Link className="pub-pill pub-pill-dark" to="/how-it-works">
          See how it works <ArrowUpRight size={17} />
        </Link>
      </div>
      <MediaSection media={media.conversation}>
        <ConversationVisual />
      </MediaSection>
    </section>
  );
}
