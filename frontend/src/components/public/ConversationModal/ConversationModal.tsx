import emailjs from "@emailjs/browser";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { Info, X, ArrowRight, Copy, Check } from "lucide-react";

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import "./ConversationModal.css";

type ConversationContextValue = {
  openConversation: () => void;
};

type FieldName = "name" | "email" | "message";

type ConversationFields = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

const initialFields: ConversationFields = {
  name: "",
  email: "",
  message: "",
};

const ConversationContext = createContext<ConversationContextValue | null>(
  null,
);

export function useConversation() {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error("useConversation must be used inside ConversationProvider");
  }

  return context;
}

function validate(fields: ConversationFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!fields.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!fields.message.trim()) {
    errors.message = "Please enter a message.";
  } else if (fields.message.trim().length < 10) {
    errors.message = "Please add a little more detail.";
  }

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <span id={id} className="kailor-conversation-error" role="alert">
      {message}
    </span>
  );
}

function ConversationDialog({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (fields: ConversationFields) => Promise<void>;
}) {
  const reducedMotion = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [emailCopied, setEmailCopied] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [fields, setFields] = useState<ConversationFields>(initialFields);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [messageExpanded, setMessageExpanded] = useState(false);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => {
      firstFieldRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), textarea:not(:disabled)",
        ) ?? [],
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [onClose]);

  const updateField = (field: FieldName, value: string) => {
    setFields((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;

    updateField("message", textarea.value);

    // Reset first so the textarea can shrink as well as grow.
    textarea.style.height = "54px";

    const naturalHeight = textarea.scrollHeight;

    const nextHeight = Math.min(Math.max(naturalHeight, 54), 210);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = naturalHeight > 210 ? "auto" : "hidden";

    setMessageExpanded(nextHeight > 66);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (sending) return;

    const nextErrors = validate(fields);
    setErrors(nextErrors);

    const firstInvalid = (["name", "email", "message"] as FieldName[]).find(
      (field) => nextErrors[field],
    );

    if (firstInvalid) {
      document.getElementById(`conversation-${firstInvalid}`)?.focus();

      return;
    }

    setSending(true);
    setSendError("");

    try {
      await onComplete({
        name: fields.name.trim(),
        email: fields.email.trim(),
        message: fields.message.trim(),
      });
    } catch (error) {
      console.error("kailor contact delivery failed:", error);

      setSendError("Your message couldn't be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("keenosmith@kailor.co.za");

      setEmailCopied(true);

      window.setTimeout(() => {
        setEmailCopied(false);
      }, 2200);
    } catch (error) {
      console.error("Failed to copy email address:", error);
    }
  };

  return (
    <motion.div
      className="kailor-conversation-backdrop"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        className="kailor-conversation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kailor-conversation-title"
        aria-describedby="kailor-conversation-description"
        initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{
          duration: reducedMotion ? 0 : 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <button
          className="kailor-conversation-close"
          type="button"
          aria-label="Close conversation form"
          onClick={onClose}
        >
          <X size={14} strokeWidth={1.7} />
        </button>

        <div className="kailor-conversation-heading">
          <h2 id="kailor-conversation-title">Let's chat</h2>

          <p id="kailor-conversation-description">
            Tell us about what you're working on, what you'd like to improve, or
            the idea you have in mind.
          </p>
        </div>

        <form
          className="kailor-conversation-form"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="kailor-conversation-fields">
            <div className="kailor-conversation-field">
              <label htmlFor="conversation-name">Your name</label>

              <input
                ref={firstFieldRef}
                id="conversation-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                maxLength={100}
                value={fields.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "conversation-name-error" : undefined
                }
              />

              <FieldError id="conversation-name-error" message={errors.name} />
            </div>

            <div className="kailor-conversation-field">
              <label htmlFor="conversation-email">Email address</label>

              <input
                id="conversation-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={fields.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "conversation-email-error" : undefined
                }
              />

              <FieldError
                id="conversation-email-error"
                message={errors.email}
              />
            </div>

            <div className="kailor-conversation-field kailor-conversation-field--full">
              <label htmlFor="conversation-message">Your message</label>

              <div
                className={`kailor-conversation-composer${
                  messageExpanded ? " is-expanded" : ""
                }`}
              >
                <textarea
                  id="conversation-message"
                  name="message"
                  rows={1}
                  placeholder="Tell us a little about your project..."
                  maxLength={3000}
                  value={fields.message}
                  onChange={handleMessageChange}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? "conversation-message-error" : undefined
                  }
                />

                <button
                  type="submit"
                  className="kailor-conversation-send"
                  disabled={sending}
                  aria-label={sending ? "Sending message" : "Send message"}
                  aria-busy={sending}
                  title={sending ? "Sending message" : "Send message"}
                >
                  {sending ? (
                    <span
                      className="kailor-conversation-loading"
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    <ArrowRight
                      size={18}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>

              {sendError && (
                <p className="kailor-conversation-send-error" role="alert">
                  {sendError}
                </p>
              )}

              <FieldError
                id="conversation-message-error"
                message={errors.message}
              />
            </div>
          </div>
        </form>

        <div className="kailor-conversation-email">
          <span>keenosmith@kailor.co.za</span>

          <button
            type="button"
            className="kailor-conversation-copy"
            onClick={handleCopyEmail}
            aria-label={emailCopied ? "Email copied" : "Copy email address"}
            title={emailCopied ? "Copied" : "Copy email address"}
          >
            {emailCopied ? (
              <Check size={14} strokeWidth={1.6} aria-hidden="true" />
            ) : (
              <Copy size={14} strokeWidth={1.6} aria-hidden="true" />
            )}
          </button>

          <span className="sr-only" role="status">
            {emailCopied ? "Email address copied to clipboard" : ""}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const pendingToastRef = useRef(false);
  const reducedMotion = useReducedMotion();

  const openConversation = useCallback(() => {
    setToast(null);
    setOpen(true);
  }, []);

  const closeConversation = useCallback(() => {
    pendingToastRef.current = false;
    setOpen(false);
  }, []);

  const completeConversation = useCallback(
    async (fields: ConversationFields) => {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;

      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error("EmailJS configuration is missing.");
      }

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: fields.name,
          reply_to: fields.email,
          subject: "Website enquiry",
          message: fields.message,
        },
        {
          publicKey,
        },
      );

      pendingToastRef.current = true;
      setOpen(false);
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ConversationContext.Provider value={{ openConversation }}>
      {children}

      {createPortal(
        <>
          <AnimatePresence
            onExitComplete={() => {
              if (pendingToastRef.current) {
                pendingToastRef.current = false;
                setToast("Your message has been sent.");
              }
            }}
          >
            {open && (
              <ConversationDialog
                key="conversation-dialog"
                onClose={closeConversation}
                onComplete={completeConversation}
              />
            )}
          </AnimatePresence>

          <div className="kailor-conversation-toast-position">
            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast}
                  className="kailor-conversation-toast"
                  role="status"
                  aria-live="polite"
                  initial={
                    reducedMotion ? false : { opacity: 0, y: -12, scale: 0.97 }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -9,
                    scale: 0.97,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Info size={16} strokeWidth={1.5} aria-hidden="true" />

                  <span>{toast}</span>

                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => setToast(null)}
                  >
                    <X size={13} strokeWidth={1.7} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>,
        document.body,
      )}
    </ConversationContext.Provider>
  );
}
