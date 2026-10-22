import { ModalClose } from "../../components/ModalClose/ModalClose";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
export function SolutionModal({
  title,
  description,
  children,
  hero,
  onClose,
  busy = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  hero?: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function close() {
    if (busy || closing) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
    timer.current = setTimeout(onClose, 160);
  }
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId(),
    descriptionId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const dialog = ref.current;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog) return;
      const nodes = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((node) => node.getClientRects().length > 0);
      if (!nodes.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = nodes[0],
        last = nodes.at(-1)!;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog?.addEventListener("keydown", trap);
    return () => {
      dialog?.removeEventListener("keydown", trap);
      clearTimeout(timer.current);
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog?.open && !dialog.contains(document.activeElement)) {
      (
        dialog.querySelector<HTMLElement>("button:not(:disabled), a[href]") ??
        dialog
      ).focus({ preventScroll: true });
    }
  }, [busy]);
  return createPortal(
    <dialog
      ref={ref}
      tabIndex={-1}
      className={`solution-modal ${closing ? "is-closing" : ""}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            close();
        }
      }}
    >
      <ModalClose
        className="solution-close"
        aria-label="Close solution dialog"
        disabled={busy}
        onClick={close}
        autoFocus
      />
      <div className="solution-modal-body">
        {hero}
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId} className="solution-modal-description">
          {description}
        </p>
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
