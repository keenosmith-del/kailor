import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { useConversation } from "../../../../components/public/ConversationModal/ConversationModal";
import "./SimulationClosing.css";
export function SimulationClosing({ restart }: { restart: () => void }) {
  const reduced = useReducedMotion();
  const { openConversation } = useConversation();
  return (
    <motion.div
      className="try-closing"
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2>That was just the beginning</h2>
      <p>
        Explore your own project with kailor, with more room to understand your
        needs and consider a direction together.
      </p>
      <div className="try-closing-actions">
        <Link className="pub-pill pub-pill-dark" to="/create-account">
          Create account
        </Link>
        <Link className="pub-pill" to="/sign-in">
          Sign in
        </Link>
      </div>
      <p className="try-account-note">
        Account access follows our controlled-testing registration policy. Your
        preview choices stay here and won't transfer to an account.
      </p>
      <div className="try-closing-secondary">
        <button type="button" onClick={restart}>
          Try another direction
        </button>
        <button type="button" onClick={openConversation}>
          Start a conversation
        </button>
      </div>
    </motion.div>
  );
}
