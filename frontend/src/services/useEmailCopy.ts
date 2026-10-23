import { useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL } from "./enquiries";
export function useEmailCopy() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [copying, setCopying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  async function copyEmail() {
    if (pending.current) return;
    pending.current = true;
    setCopying(true);
    setCopyError("");
    clearTimeout(timer.current);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      if (!mounted.current) return;
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      if (mounted.current) {
        setCopied(false);
        setCopyError(
          "Couldn't copy. Select the address or open your email app.",
        );
      }
    } finally {
      pending.current = false;
      if (mounted.current) setCopying(false);
    }
  }
  return { copied, copyError, copying, copyEmail };
}
