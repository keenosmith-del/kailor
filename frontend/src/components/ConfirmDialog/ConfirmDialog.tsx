import { createPortal } from "react-dom";
import { useEffect, useId, useRef, type ReactNode } from "react";
import "./ConfirmDialog.css";
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busyLabel = "Starting again…",
  busy,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  busy: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId(),
    descriptionId = useId();
  const dialog = useRef<HTMLElement>(null),
    cancel = useRef<HTMLButtonElement>(null);
  const callbacks = useRef({ onClose, busy });
  callbacks.current = { onClose, busy };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const shell = document.querySelector<HTMLElement>(".app-shell");
    const inert = shell?.inert ?? false,
      overflow = document.body.style.overflow;
    if (shell) shell.inert = true;
    document.body.style.overflow = "hidden";
    cancel.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!callbacks.current.busy) callbacks.current.onClose();
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        dialog.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        ) ?? [],
      );
      if (!nodes.length) {
        event.preventDefault();
        return;
      }
      if (
        !dialog.current?.contains(document.activeElement) ||
        (event.shiftKey && document.activeElement === nodes[0])
      ) {
        event.preventDefault();
        (event.shiftKey ? nodes.at(-1) : nodes[0])?.focus();
      } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
        event.preventDefault();
        nodes[0]?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      if (shell) shell.inert = inert;
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      requestAnimationFrame(() => {
        if (previous?.isConnected) previous.focus({ preventScroll: true });
        else
          document
            .querySelector<HTMLElement>(".question-section h1")
            ?.focus({ preventScroll: true });
      });
    };
  }, []);
  return createPortal(
    <div
      className="confirm-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="confirm-dialog"
      >
        <h2 id={titleId}>{title}</h2>
        <div id={descriptionId}>{children}</div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-dialog-actions">
          <button ref={cancel} disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button
            className="confirm-dialog-submit"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
