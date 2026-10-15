import "./PlanNavigation.css";
import { useEffect, useRef, useState } from "react";
import { PlanManager } from "../PlanManager/PlanManager";
export function PlanNavigation({
  sessionId,
  planId,
  title,
  busy = false,
  onChange,
}: {
  sessionId?: string;
  planId?: string;
  title?: string;
  busy?: boolean;
  onChange?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <div className="plan-navigation">
      <span>{title ?? "Your plans"}</span>
      <button
        className="text-link"
        disabled={busy}
        onClick={() => setOpen((x) => !x)}
      >
        {open ? "Close plans" : "Change plan"}
      </button>
      <dialog
        ref={dialog}
        className="plan-dialog"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <button className="text-link" onClick={() => setOpen(false)}>
          Close plans
        </button>
        {open && (
          <PlanManager
            currentPlanId={planId}
            currentSessionId={sessionId}
            onNavigated={() => {
              setOpen(false);
              onChange?.();
            }}
          />
        )}
      </dialog>
    </div>
  );
}
