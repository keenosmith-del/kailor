import { ModalClose } from "../../ModalClose/ModalClose";
import { CONTACT_EMAIL, ENQUIRY_LIMITS } from "../../../services/enquiries";
import { useEnquiry } from "../../../services/useEnquiry";
import { useEmailCopy } from "../../../services/useEmailCopy";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Info, X, Copy, Check } from "lucide-react";

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { EnquiryComposer } from "../EnquiryComposer/EnquiryComposer";
import "./ConversationModal.css";

type ConversationContextValue = {
  openConversation: () => void;
  showToast: (message: string) => void;
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
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const {
    copied: emailCopied,
    copyError,
    copying,
    copyEmail: handleCopyEmail,
  } = useEmailCopy();
  const { fields, errors, sending, sendError, updateField, handleSubmit } =
    useEnquiry({
      onSent: onComplete,
      resetOnSent: false,
      onInvalid: (field) =>
        document.getElementById(`conversation-${field}`)?.focus(),
    });

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
          "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]",
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
        <ModalClose
          className="kailor-conversation-close"
          type="button"
          aria-label="Close conversation form"
          onClick={onClose}
        />

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
                maxLength={ENQUIRY_LIMITS.name}
                aria-required="true"
                disabled={sending}
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
                aria-required="true"
                disabled={sending}
                maxLength={ENQUIRY_LIMITS.email}
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

              <EnquiryComposer
                id="conversation-message"
                value={fields.message}
                onChange={(value) => updateField("message", value)}
                sending={sending}
                invalid={Boolean(errors.message)}
                describedBy={
                  errors.message ? "conversation-message-error" : undefined
                }
              />

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
          <span>{CONTACT_EMAIL}</span>

          <button
            type="button"
            className="kailor-conversation-copy"
            onClick={handleCopyEmail}
            disabled={copying}
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
        {copyError && (
          <p className="kailor-conversation-send-error" role="status">
            {copyError} <a href={`mailto:${CONTACT_EMAIL}`}>Send an email</a>
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(
    null,
  );
  const toastId = useRef(0);
  const showToast = useCallback((message: string) => {
    setToast({ message, id: ++toastId.current });
  }, []);

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

  const completeConversation = useCallback(() => {
    pendingToastRef.current = true;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ConversationContext.Provider value={{ openConversation, showToast }}>
      {children}

      {typeof document !== "undefined" &&
        createPortal(
          <>
            <AnimatePresence
              onExitComplete={() => {
                if (pendingToastRef.current) {
                  pendingToastRef.current = false;
                  showToast("Your message has been sent.");
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
                    key={toast.id}
                    className="kailor-conversation-toast"
                    role="status"
                    aria-live="polite"
                    initial={
                      reducedMotion
                        ? false
                        : { opacity: 0, y: -12, scale: 0.97 }
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

                    <span>{toast.message}</span>

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
