import { useState } from "react";
import { Link } from "react-router";
import { Check, Copy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { CAREER_INTERESTS } from "../../../../../shared/src/careers";
import { PageBack } from "../../../components/public/PageBack/PageBack";
import { useConversation } from "../../../components/public/ConversationModal/ConversationModal";
import { ProcessReveal } from "../HowItWorks/ProcessReveal";
import { CONTACT_EMAIL } from "../../../services/enquiries";
import { useEmailCopy } from "../../../services/useEmailCopy";
import { ApplicationForm } from "./ApplicationForm/ApplicationForm";
import "./Careers.css";
export default function Careers() {
  const [interests, setInterests] = useState<string[]>([]),
    [sending, setSending] = useState(false);
  const { copied, copyError, copying, copyEmail } = useEmailCopy();
  const { openConversation } = useConversation();
  const reduced = useReducedMotion();
  return (
    <div className="careers-page">
      <noscript>
        <style>{`.careers-page .hiw-scroll-content, .careers-page .career-form-card, .careers-page .careers-interests button { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      <PageBack />
      <div className="careers-composition">
        <div className="careers-editorial">
          <ProcessReveal>
            <h1>Work with kailor</h1>
          </ProcessReveal>
          <ProcessReveal>
            <p className="careers-intro">
              Interested in the work we're doing? Tell us a little about
              yourself, what you specialise in and where you'd like to
              contribute.
            </p>
          </ProcessReveal>
          <ProcessReveal>
            <div className="careers-availability">
              <h2>General expressions of interest</h2>
              <p>
                We welcome thoughtful introductions from people working across
                technology, engineering and related disciplines.
              </p>
              <p>
                This is an introduction, rather than an application for an
                advertised role.
              </p>
            </div>
          </ProcessReveal>
          <ProcessReveal>
            <div className="careers-email">
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <button
                type="button"
                aria-label={copied ? "Email copied" : "Copy email address"}
                onClick={copyEmail}
                disabled={copying}
              >
                {copied ? (
                  <Check size={15} strokeWidth={1.5} />
                ) : (
                  <Copy size={15} strokeWidth={1.5} />
                )}
              </button>
            </div>
            <p className="careers-copy-status" role="status">
              {copyError || (copied ? "Copied" : "")}
              {copyError && (
                <>
                  {" "}
                  <a href={`mailto:${CONTACT_EMAIL}`}>Send an email</a>
                </>
              )}
            </p>
          </ProcessReveal>
          <ProcessReveal>
            <section className="careers-interests">
              <h2>Where would you like to contribute?</h2>
              <p>Choose any that reflect your interests</p>
              <div role="group" aria-label="Professional interests">
                {CAREER_INTERESTS.map((interest, index) => (
                  <motion.button
                    key={interest}
                    type="button"
                    aria-pressed={interests.includes(interest)}
                    disabled={sending}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{
                      duration: reduced ? 0 : 0.35,
                      delay: reduced ? 0 : index * 0.035,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() =>
                      setInterests((current) =>
                        current.includes(interest)
                          ? current.filter((value) => value !== interest)
                          : [...current, interest],
                      )
                    }
                  >
                    {interest}
                  </motion.button>
                ))}
              </div>
            </section>
          </ProcessReveal>
        </div>
        <ApplicationForm
          interests={interests}
          sending={sending}
          setSending={setSending}
        />
      </div>
      <ProcessReveal className="careers-actions">
        <nav aria-label="Helpful information">
          <Link to="/how-it-works">How it works</Link>
          <Link to="/#what-weve-built">What we've built</Link>
          <Link to="/contact">Contact us</Link>
          <button type="button" onClick={openConversation}>
            Start a conversation
          </button>
        </nav>
      </ProcessReveal>
    </div>
  );
}
