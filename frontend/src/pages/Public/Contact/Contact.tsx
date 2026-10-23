import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Copy, Check } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { PageBack } from "../../../components/public/PageBack/PageBack";
import { useConversation } from "../../../components/public/ConversationModal/ConversationModal";
import {
  CONTACT_EMAIL,
  ENQUIRY_TOPICS,
  type EnquiryTopic,
} from "../../../services/enquiries";
import { useEnquiry } from "../../../services/useEnquiry";
import { useEmailCopy } from "../../../services/useEmailCopy";
import { ContactForm } from "./ContactForm/ContactForm";
import "./Contact.css";
function ContactReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.16, 0.86, 1],
    [0, 1, 1, 0],
  );
  const y = useTransform(scrollYProgress, [0, 0.16, 0.86, 1], [14, 0, 0, -12]);
  return (
    <div ref={ref} className={className}>
      <motion.div
        style={{ opacity: reduced ? 1 : opacity, y: reduced ? 0 : y }}
      >
        {children}
      </motion.div>
    </div>
  );
}
const topicStarters: Record<EnquiryTopic, string> = {
  "I have a project in mind":
    "I have a project in mind and would like to discuss it with kailor. ",
  "I need technical advice": "I'd like technical advice about ",
  "I'm exploring AI or automation": "I'm exploring AI or automation for ",
  "Something else": "I'd like to get in touch about ",
};
export default function Contact() {
  const { openConversation, showToast } = useConversation();
  const [topic, setTopic] = useState<EnquiryTopic | "">("");
  const enquiry = useEnquiry({
    topic,
    onSent: () => showToast("Your message has been sent."),
    onInvalid: (field) => document.getElementById(`contact-${field}`)?.focus(),
  });
  const { copied, copyError, copying, copyEmail } = useEmailCopy();
  const reduced = useReducedMotion();
  const lastStarter = useRef("");
  function chooseTopic(label: EnquiryTopic) {
    const next = topic === label ? "" : label;
    setTopic(next);
    if (
      !enquiry.fields.message.trim() ||
      enquiry.fields.message === lastStarter.current
    ) {
      const starter = next ? topicStarters[next] : "";
      enquiry.updateField("message", starter);
      lastStarter.current = starter;
    }
    requestAnimationFrame(() => {
      const textarea = document.getElementById(
        "contact-message",
      ) as HTMLTextAreaElement | null;
      textarea?.focus({ preventScroll: true });
      textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea?.scrollIntoView({
        block: "nearest",
        behavior: reduced ? "instant" : "smooth",
      });
    });
  }
  return (
    <div className="contact-page">
      <PageBack />
      <div className="contact-composition">
        <div className="contact-editorial">
          <ContactReveal>
            <h1>Get in touch</h1>
          </ContactReveal>
          <ContactReveal>
            <p className="contact-intro">
              Have an idea, a challenge or a project in mind? Tell us a little
              about it.
            </p>
          </ContactReveal>
          <ContactReveal className="contact-email-block">
            <div className="contact-email-row">
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <button
                type="button"
                className="contact-copy"
                aria-label={copied ? "Email copied" : "Copy email address"}
                disabled={copying}
                onClick={copyEmail}
              >
                {copied ? (
                  <Check size={15} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Copy size={15} strokeWidth={1.5} aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="contact-copy-status" role="status">
              {copyError || (copied ? "Copied" : "")}
              {copyError && (
                <>
                  {" "}
                  <a href={`mailto:${CONTACT_EMAIL}`}>Send an email</a>
                </>
              )}
            </p>
          </ContactReveal>
        </div>
        <ContactForm enquiry={enquiry} topic={topic} />
      </div>
      <ContactReveal className="contact-actions">
        <h2>What would you like to talk about?</h2>
        <div className="contact-topics" role="group" aria-label="Enquiry topic">
          {ENQUIRY_TOPICS.map((label, index) => (
            <motion.button
              type="button"
              key={label}
              aria-pressed={topic === label}
              disabled={enquiry.sending}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{
                duration: reduced ? 0 : 0.35,
                delay: reduced ? 0 : index * 0.035,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => chooseTopic(label)}
            >
              {label}
            </motion.button>
          ))}
        </div>
        <nav className="contact-helpful" aria-label="Helpful information">
          <Link to="/how-it-works">How it works</Link>
          <Link to="/questions">Common questions</Link>
          <button type="button" onClick={openConversation}>
            Start conversation
          </button>
        </nav>
      </ContactReveal>
    </div>
  );
}
