import { useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  CONTACT_EMAIL,
  ENQUIRY_LIMITS,
  type EnquiryTopic,
} from "../../../../services/enquiries";
import type { useEnquiry } from "../../../../services/useEnquiry";
import { EnquiryComposer } from "../../../../components/public/EnquiryComposer/EnquiryComposer";
import "./ContactForm.css";
export function ContactForm({
  enquiry,
  topic,
}: {
  enquiry: ReturnType<typeof useEnquiry>;
  topic: EnquiryTopic | "";
}) {
  const reduced = useReducedMotion();
  const [engaged, setEngaged] = useState(false);
  const { fields, errors, sending, sendError, updateField, handleSubmit } =
    enquiry;
  return (
    <motion.div
      className="contact-form-card"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced || engaged ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      onFocusCapture={() => setEngaged(true)}
    >
      <h2>Your enquiry</h2>
      <form
        className="contact-enquiry-form"
        aria-label="Contact enquiry"
        noValidate
        onSubmit={handleSubmit}
        aria-busy={sending}
      >
        <input type="hidden" name="enquiry-topic" value={topic} />
        <div className="contact-input-row">
          {(
            [
              ["name", "Your name", "text", "name"],
              ["email", "Email address", "email", "email"],
            ] as const
          ).map(([field, label, type, autoComplete]) => (
            <div className="contact-field" key={field}>
              <label htmlFor={`contact-${field}`}>{label}</label>
              <input
                id={`contact-${field}`}
                name={field}
                type={type}
                placeholder={field === "name" ? "Your name" : "you@company.com"}
                autoComplete={autoComplete}
                aria-required="true"
                maxLength={ENQUIRY_LIMITS[field]}
                value={fields[field]}
                disabled={sending}
                onChange={(event) => updateField(field, event.target.value)}
                aria-invalid={Boolean(errors[field])}
                aria-describedby={
                  errors[field] ? `contact-${field}-error` : undefined
                }
              />
              {errors[field] && (
                <span
                  className="contact-field-error"
                  id={`contact-${field}-error`}
                  role="alert"
                >
                  {errors[field]}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="contact-field">
          <label htmlFor="contact-message">Your message</label>
          <EnquiryComposer
            id="contact-message"
            value={fields.message}
            onChange={(value) => updateField("message", value)}
            sending={sending}
            invalid={Boolean(errors.message)}
            describedBy={errors.message ? "contact-message-error" : undefined}
          />

          {errors.message && (
            <span
              className="contact-field-error"
              id="contact-message-error"
              role="alert"
            >
              {errors.message}
            </span>
          )}
        </div>
        {sendError && (
          <p className="contact-delivery-error" role="alert">
            Your message couldn't be sent. Please{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>email {CONTACT_EMAIL}</a>.
          </p>
        )}
        <div className="contact-form-bottom">
          <p>
            We'll use these details to respond to your enquiry.{" "}
            <Link to="/privacy">Privacy</Link>
          </p>
        </div>
      </form>
    </motion.div>
  );
}
