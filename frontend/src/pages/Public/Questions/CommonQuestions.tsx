import { Link } from "react-router";
import { PageShell } from "../../../components/public/PageShell/PageShell";
import { useConversation } from "../../../components/public/ConversationModal/ConversationModal";
import "./CommonQuestions.css";
export default function CommonQuestions() {
  const { openConversation } = useConversation();
  return (
    <PageShell title="Common questions">
      <div className="common-questions-list">
        <details>
          <summary>What does kailor help with?</summary>
          <p>
            Technology consultancy, software engineering, AI and automation, and
            cloud infrastructure. We start with your goals and existing systems
            to understand what would help.
          </p>
        </details>
        <details>
          <summary>How do I discuss a project?</summary>
          <p>
            Start a conversation and share your name, email address and what you
            have in mind. You can also email{" "}
            <a href="mailto:keenosmith@kailor.co.za">keenosmith@kailor.co.za</a>
            .
          </p>
        </details>
        <details>
          <summary>Can I access the application?</summary>
          <p>
            The application is in controlled testing. Registration may be
            restricted or require an invitation, and guest entry is disabled
            during testing. Existing approved users can{" "}
            <Link to="/sign-in">sign in</Link>.
          </p>
        </details>
        <details>
          <summary>How are scope and pricing agreed?</summary>
          <p>
            Consulting and implementation are scoped and agreed individually. A
            website conversation or application recommendation is a starting
            point for that discussion.
          </p>
        </details>
      </div>
      <div className="common-questions-more">
        <h2>More questions?</h2>
        <button
          type="button"
          className="common-questions-chat"
          onClick={openConversation}
        >
          Ask us a question
        </button>
      </div>
    </PageShell>
  );
}
