import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ENQUIRY_LIMITS } from "../../../services/enquiries";
import "./EnquiryComposer.css";
export function EnquiryComposer({
  id,
  value,
  onChange,
  sending,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  sending: boolean;
  invalid: boolean;
  describedBy?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = "54px";
    const height = Math.min(Math.max(textarea.scrollHeight, 54), 210);
    textarea.style.height = `${height}px`;
    textarea.style.overflowY = textarea.scrollHeight > 210 ? "auto" : "hidden";
    setExpanded(height > 66);
  }, [value]);
  return (
    <div
      className={`kailor-enquiry-composer kailor-conversation-composer${expanded ? " is-expanded" : ""}`}
    >
      <textarea
        ref={ref}
        id={id}
        name="message"
        rows={1}
        placeholder="Tell us a little about your project..."
        maxLength={ENQUIRY_LIMITS.message}
        value={value}
        disabled={sending}
        onChange={(event) => onChange(event.target.value)}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
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
          <span className="kailor-conversation-loading" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        ) : (
          <ArrowRight size={18} strokeWidth={1.7} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
