import { Link } from "react-router";
import { useConversation } from "../../../../components/public/ConversationModal/ConversationModal";
import { ProcessReveal } from "../ProcessReveal";
import "./ProcessClosing.css";
export function ProcessClosing() {
  const { openConversation } = useConversation();
  return (
    <section
      className="hiw-process-closing"
      aria-labelledby="hiw-closing-title"
    >
      <ProcessReveal>
        <h2 id="hiw-closing-title">Tell us what you're working on</h2>
      </ProcessReveal>
      <ProcessReveal>
        <p>You don't need to have the answer before getting in touch</p>
      </ProcessReveal>
      <ProcessReveal>
        <div className="hiw-closing-actions">
          <button type="button" onClick={openConversation}>
            Start a conversation
          </button>
          <Link to="/questions">Common questions</Link>
        </div>
      </ProcessReveal>
    </section>
  );
}
