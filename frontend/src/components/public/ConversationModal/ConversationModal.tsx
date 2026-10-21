import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Info, X } from "lucide-react";

import "./ConversationModal.css";

type ConversationContextValue = {
  openConversation: () => void;
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

function ConversationDialog({
  onClose,
  onPreview,
}: {
  onClose: () => void;
  onPreview: () => void;
}) {
  const reducedMotion = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

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
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
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
      transition={{ duration: reducedMotion ? 0 : 0.22 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        ref={dialogRef}
        className="kailor-conversation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kailor-conversation-title"
        aria-describedby="kailor-conversation-description"
        initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.975 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 14,
          scale: 0.985,
        }}
        transition={{
          duration: reducedMotion ? 0 : 0.42,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <button
          className="kailor-conversation-close"
          type="button"
          aria-label="Close conversation form"
          onClick={onClose}
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        <div className="kailor-conversation-heading">
          <h2 id="kailor-conversation-title">Let's start a conversation</h2>

          <p id="kailor-conversation-description">
            Tell us a little about what you're working on, what you'd like to
            improve, or the idea you have in mind.
          </p>
        </div>

        <form
          className="kailor-conversation-form"
          onSubmit={(event) => {
            event.preventDefault();
            onPreview();
          }}
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
                placeholder="How should we address you?"
                maxLength={100}
                required
              />
            </div>

            <div className="kailor-conversation-field">
              <label htmlFor="conversation-email">Email address</label>

              <input
                id="conversation-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="kailor-conversation-field kailor-conversation-field--full">
              <label htmlFor="conversation-subject">Subject</label>

              <input
                id="conversation-subject"
                name="subject"
                type="text"
                placeholder="What would you like to discuss?"
                maxLength={140}
                required
              />
            </div>

            <div className="kailor-conversation-field kailor-conversation-field--full">
              <label htmlFor="conversation-message">Your message</label>

              <textarea
                id="conversation-message"
                name="message"
                rows={4}
                minLength={10}
                maxLength={3000}
                placeholder="Tell us about the idea, challenge or project..."
                required
              />
            </div>
          </div>

          <div className="kailor-conversation-footer">
            <p>
              Please don't include passwords or sensitive business information
              in your initial message.
            </p>

            <button type="submit" className="kailor-conversation-submit">
              Send message
            </button>
          </div>

          <p className="kailor-conversation-preview-note">
            Message delivery is not connected yet. This is the visual form
            preview.
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const reducedMotion = useReducedMotion();

  const openConversation = useCallback(() => {
    setOpen(true);
  }, []);

  const closeConversation = useCallback(() => {
    setOpen(false);
  }, []);

  const previewMessage = useCallback(() => {
    setToast("Message delivery isn't connected yet. Nothing was sent.");
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4600);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ConversationContext.Provider value={{ openConversation }}>
      {children}

      {createPortal(
        <>
          <AnimatePresence>
            {open && (
              <ConversationDialog
                key="conversation-dialog"
                onClose={closeConversation}
                onPreview={previewMessage}
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
                    reducedMotion ? false : { opacity: 0, y: -14, scale: 0.96 }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    scale: 0.97,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.32,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Info size={16} strokeWidth={1.6} aria-hidden="true" />

                  <span>{toast}</span>

                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => setToast(null)}
                  >
                    <X size={14} strokeWidth={1.7} />
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
