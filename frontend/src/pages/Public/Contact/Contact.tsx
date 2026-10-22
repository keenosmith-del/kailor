import { PageShell } from "../../../components/public/PageShell/PageShell";
import "./Contact.css";
import { useConversation } from "../../../components/public/ConversationModal/ConversationModal";
export default function Contact() {
  const { openConversation } = useConversation();
  return (
    <PageShell title="Contact">
      <button
        type="button"
        className="pub-pill pub-pill--dark"
        onClick={openConversation}
      >
        Start conversation
      </button>
      <p>
        <a href="mailto:keenosmith@kailor.co.za">keenosmith@kailor.co.za</a>
      </p>
    </PageShell>
  );
}
