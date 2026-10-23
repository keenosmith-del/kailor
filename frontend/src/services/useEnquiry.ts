import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  emptyEnquiry,
  ENQUIRY_FAILURE,
  sendEnquiry,
  validateEnquiry,
  type EnquiryErrors,
  type EnquiryField,
  type EnquiryTopic,
} from "./enquiries";
export function useEnquiry({
  onSent,
  onInvalid,
  topic = "",
  resetOnSent = true,
}: {
  onSent: () => void;
  onInvalid: (field: EnquiryField) => void;
  topic?: EnquiryTopic | "";
  resetOnSent?: boolean;
}) {
  const [fields, setFields] = useState({ ...emptyEnquiry });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function updateField(field: EnquiryField, value: string) {
    setFields((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const nextErrors = validateEnquiry(fields);
    setErrors(nextErrors);
    const firstInvalid = (["name", "email", "message"] as const).find(
      (field) => nextErrors[field],
    );
    if (firstInvalid) {
      onInvalid(firstInvalid);
      return;
    }
    pending.current = true;
    setSending(true);
    setSendError("");
    try {
      await sendEnquiry(fields, topic);
      if (!mounted.current) return;
      if (resetOnSent) setFields({ ...emptyEnquiry });
      onSent();
    } catch {
      if (mounted.current) setSendError(ENQUIRY_FAILURE);
    } finally {
      pending.current = false;
      if (mounted.current) setSending(false);
    }
  }
  return { fields, errors, sending, sendError, updateField, handleSubmit };
}
