import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ModalClose } from "../../../components/ModalClose/ModalClose";
import type { TimelineDetailContent } from "./timelineData";
export function TimelineDetail({
  content,
  onClose,
}: {
  content: TimelineDetailContent;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLButtonElement>("button")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="timeline-detail"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target !== ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <ModalClose
        className="timeline-detail-close"
        aria-label="Close timeline detail"
        onClick={onClose}
      />
      <p className="timeline-caption">{content.label}</p>
      <h2 id={`${id}-title`}>{content.title}</h2>
      <p id={`${id}-description`}>{content.detail}</p>
    </dialog>,
    document.body,
  );
}
