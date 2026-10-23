import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  CAREER_LIMITS,
  emptyCareerFields,
  validateCareer,
  type CareerErrors,
  type CareerFields,
} from "../../../../../../shared/src/careers";
import { useConversation } from "../../../../components/public/ConversationModal/ConversationModal";
import { CONTACT_EMAIL } from "../../../../services/enquiries";
import { CVAttachment } from "../CVAttachment/CVAttachment";
import "./ApplicationForm.css";
export interface SubmissionPolicy {
  available: boolean;
  processor?: string;
  region?: string;
  retentionDays?: number;
}
export function ApplicationForm({
  interests,
  sending,
  setSending,
}: {
  interests: string[];
  sending: boolean;
  setSending: (value: boolean) => void;
}) {
  const [fields, setFields] = useState<CareerFields>({ ...emptyCareerFields }),
    [errors, setErrors] = useState<CareerErrors>({});
  const [file, setFile] = useState<File | null>(null),
    [acknowledged, setAcknowledged] = useState(false);
  const [policy, setPolicy] = useState<SubmissionPolicy | null>(null),
    [failure, setFailure] = useState("");
  const [engaged, setEngaged] = useState(false),
    [loadingPolicy, setLoadingPolicy] = useState(true);
  const pending = useRef(false),
    mounted = useRef(true),
    request = useRef<AbortController | null>(null);
  const reduced = useReducedMotion(),
    { showToast } = useConversation();
  async function loadPolicy(signal?: AbortSignal) {
    setLoadingPolicy(true);
    try {
      const response = await fetch("/api/careers/policy", {
        signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (mounted.current)
        setPolicy({
          ...result,
          available:
            result.available === true &&
            typeof result.processor === "string" &&
            typeof result.region === "string" &&
            Number.isInteger(result.retentionDays) &&
            result.retentionDays > 0,
        });
    } catch {
      if (mounted.current) setPolicy({ available: false });
    } finally {
      if (mounted.current) setLoadingPolicy(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void loadPolicy(controller.signal);
    return () => {
      mounted.current = false;
      controller.abort();
      request.current?.abort();
    };
  }, []);
  function change(key: keyof CareerFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const issues = validateCareer(fields, acknowledged);
    if (errors.cv) issues.cv = errors.cv;
    setErrors(issues);
    const first = Object.keys(issues)[0];
    if (first) {
      document.getElementById(`career-${first}`)?.focus();
      return;
    }
    if (!policy?.available) return;
    pending.current = true;
    setSending(true);
    setFailure("");
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const data = new FormData();
      for (const [key, value] of Object.entries(fields))
        data.set(key, value.trim());
      data.set("interests", JSON.stringify(interests));
      data.set("acknowledgement", "true");
      if (file) data.set("cv", file, file.name);
      const response = await fetch("/api/careers/introductions", {
        method: "POST",
        body: data,
        signal: controller.signal,
        credentials: "same-origin",
      });
      const receipt = await response.json();
      if (response.status !== 201 || receipt.received !== true)
        throw new Error();
      if (mounted.current) {
        setFields({ ...emptyCareerFields });
        setFile(null);
        setAcknowledged(false);
        showToast("Introduction received. Thank you for getting in touch.");
      }
    } catch {
      if (mounted.current)
        setFailure(
          "Your introduction could not be confirmed. Your information and CV have been kept here. Please try again or send an email.",
        );
    } finally {
      clearTimeout(timeout);
      pending.current = false;
      if (mounted.current) setSending(false);
    }
  }
  const definitions = [
    ["name", "Full name", "Your name", "text", "name"],
    ["email", "Email address", "you@example.com", "email", "email"],
    ["phone", "Phone number (optional)", "+27…", "tel", "tel"],
    [
      "location",
      "Location (optional)",
      "City, region or country",
      "text",
      "address-level2",
    ],
    [
      "link1",
      "Portfolio, GitHub or LinkedIn (optional)",
      "https://",
      "url",
      "url",
    ],
    ["link2", "Another professional link (optional)", "https://", "url", "off"],
  ] as const;
  return (
    <motion.div
      className="career-form-card"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced || engaged ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      onFocusCapture={() => setEngaged(true)}
    >
      <h2>Your introduction</h2>
      <form
        aria-label="Career introduction"
        noValidate
        onSubmit={submit}
        aria-busy={sending}
      >
        <div className="career-input-grid">
          {definitions.map(([key, label, placeholder, type, autoComplete]) => (
            <div className="career-field" key={key}>
              <label htmlFor={`career-${key}`}>{label}</label>
              <input
                id={`career-${key}`}
                name={key}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                maxLength={CAREER_LIMITS[key]}
                value={fields[key]}
                onChange={(event) => change(key, event.target.value)}
                disabled={sending}
                aria-required={key === "name" || key === "email"}
                aria-invalid={!!errors[key]}
                aria-describedby={
                  errors[key] ? `career-${key}-error` : undefined
                }
              />
              {errors[key] && (
                <span
                  className="career-field-error"
                  id={`career-${key}-error`}
                  role="alert"
                >
                  {errors[key]}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="career-field">
          <label htmlFor="career-message">A little about yourself</label>
          <textarea
            id="career-message"
            name="message"
            placeholder="Tell us a little about your background and the kind of work you're interested in."
            rows={4}
            maxLength={3000}
            value={fields.message}
            onChange={(event) => change("message", event.target.value)}
            disabled={sending}
            aria-required="true"
            aria-invalid={!!errors.message}
            aria-describedby={
              errors.message ? "career-message-error" : undefined
            }
          />
          {errors.message && (
            <span
              className="career-field-error"
              id="career-message-error"
              role="alert"
            >
              {errors.message}
            </span>
          )}
        </div>
        <CVAttachment
          file={file}
          onChange={setFile}
          error={errors.cv}
          setError={(cv) =>
            setErrors((current) => ({ ...current, cv: cv || undefined }))
          }
          disabled={sending}
        />
        <div className="career-privacy">
          <p>
            We use your introduction to review your experience and contact you
            about relevant opportunities.{" "}
            <Link to="/privacy#applicant-information">Privacy information</Link>
          </p>
          {policy?.available && (
            <p>
              Processed privately by {policy.processor} in {policy.region}.
              Records are scheduled for deletion within {policy.retentionDays}{" "}
              days. Documents are scanned before acceptance.
            </p>
          )}
          <label className="career-acknowledgement">
            <input
              id="career-acknowledgement"
              type="checkbox"
              checked={acknowledged}
              disabled={sending}
              onChange={(event) => {
                setAcknowledged(event.target.checked);
                setErrors((current) => ({
                  ...current,
                  acknowledgement: undefined,
                }));
              }}
              aria-required="true"
              aria-invalid={!!errors.acknowledgement}
              aria-describedby={
                errors.acknowledgement
                  ? "career-acknowledgement-error"
                  : undefined
              }
            />
            <span>
              I have read the Privacy information and acknowledge this use of my
              introduction and any attached CV.
            </span>
          </label>
          {errors.acknowledgement && (
            <span
              className="career-field-error"
              id="career-acknowledgement-error"
              role="alert"
            >
              {errors.acknowledgement}
            </span>
          )}
        </div>
        <div className="career-submission-status" role="status">
          {loadingPolicy ? (
            "Checking online submissions…"
          ) : !policy?.available ? (
            <>
              <p>
                Online introductions are currently unavailable. You can{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Working%20with%20kailor`}
                >
                  introduce yourself by email
                </a>
                .
              </p>
              <button type="button" onClick={() => void loadPolicy()}>
                Check availability
              </button>
            </>
          ) : null}
        </div>
        {failure && (
          <p className="career-failure" role="alert">
            {failure} <a href={`mailto:${CONTACT_EMAIL}`}>Email kailor</a>
          </p>
        )}
        <button
          className="career-submit"
          type="submit"
          disabled={sending || loadingPolicy || !policy?.available}
          aria-busy={sending}
        >
          {sending ? (
            <>
              <span>Sending introduction</span>
              <span className="career-sending" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </>
          ) : (
            "Send introduction"
          )}
        </button>
      </form>
    </motion.div>
  );
}
