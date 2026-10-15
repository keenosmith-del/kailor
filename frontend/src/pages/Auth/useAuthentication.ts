import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Account } from "../../types/account";
import { api } from "../../services/api";
import { useDiscoveryEntry } from "../../services/useDiscoveryEntry";
import { errorMessage } from "../../utils/errorMessage";

export function useAuthentication(
  signup: boolean,
  onLogin: (account: Account) => void,
) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = params.get("returnTo") ?? "/app/chat";
  const returnTo =
    /^\/(?:app\/[^?#]+|preview\/[a-f0-9-]+\/account|workspace|plans(?:\/[^?#]*)?|sessions\/[^?#]+)$/.test(
      requested,
    )
      ? requested
      : "/app/chat";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const guest = useDiscoveryEntry({ guestOnly: true });
  useEffect(() => {
    setPassword("");
    setConfirmation("");
    setShowPassword(false);
    setError("");
  }, [signup]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || guest.busy) return;
    setError("");
    if (signup && password !== confirmation) {
      setError("Your passwords do not match.");
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const account = await api<Account>(
        signup ? "/auth/register" : "/auth/login",
        "POST",
        {
          email: email.trim().toLowerCase(),
          password,
          ...(signup ? { name: name.trim() } : {}),
        },
      );
      onLogin(account);
      setPassword("");
      setConfirmation("");
      navigate(returnTo, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmation,
    setConfirmation,
    showPassword,
    setShowPassword,
    error,
    busy,
    guest,
    submit,
    switchHref: `${signup ? "/sign-in" : "/create-account"}?returnTo=${encodeURIComponent(returnTo)}`,
  };
}
