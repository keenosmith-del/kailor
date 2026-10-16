import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./ErrorBox.css";
export function ErrorBox({
  error,
  className = "",
}: {
  error: string;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => setDismissed(false), [error]);
  return error && !dismissed ? (
    <div className={`error ${className}`} role="alert">
      <span>{error}</span>
      <button
        type="button"
        className="error-dismiss"
        aria-label="Dismiss message"
        onClick={() => setDismissed(true)}
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  ) : null;
}
