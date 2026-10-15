import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { Session } from "../../../shared/src/index";
import { api, ApiError } from "./api";
import { errorMessage } from "../utils/errorMessage";
import type { Account } from "../types/account";

export function useDiscoveryEntry({ guestOnly = false } = {}) {
  const navigate = useNavigate();
  const pending = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function start() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      let account: Account | null = null;
      if (!guestOnly) {
        account = await api<Account>("/auth/me").catch((e: unknown) => {
          if (e instanceof ApiError && e.status === 401) return null;
          throw e;
        });
      }
      if (!mounted.current) return;
      // Explicit guest endpoint also works from / and authentication routes.
      // Guest cookies and account cookies remain independent.
      const session = account
        ? await api<Session>("/sessions", "POST", { name: "New plan" })
        : await api<Session>("/guest/sessions", "POST", {});
      if (mounted.current)
        navigate(
          `/${account ? "sessions" : "preview"}/${session.id}/discovery`,
        );
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return { start, busy, error };
}
