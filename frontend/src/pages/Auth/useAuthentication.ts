import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Account } from "../../types/account";
import { api } from "../../services/api";
import { errorMessage } from "../../utils/errorMessage";

type AuthField = "name" | "email" | "password" | "confirmation" | "invite";
type AuthErrors = Partial<Record<AuthField, string>>;
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
  const [fieldErrors, setFieldErrors] = useState<AuthErrors>({});
  const clearField = (field: AuthField) =>
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [policy, setPolicy] = useState<"closed" | "invite" | "public">(
    "closed",
  );
  const [policyReady, setPolicyReady] = useState(false);
  const [invite, setInvite] = useState("");
  useEffect(() => {
    let active = true;
    void api<{
      registration: "closed" | "invite" | "public";
      guestAccess: boolean;
    }>("/auth/policy")
      .then((value) => {
        if (!active) return;
        setPolicy(
          ["closed", "invite", "public"].includes(value.registration)
            ? value.registration
            : "closed",
        );
        setPolicyReady(true);
      })
      .catch(() => {
        if (active) setPolicyReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setPassword("");
    setConfirmation("");
    setShowPassword(false);
    setError("");
    setFieldErrors({});
  }, [signup]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || (signup && (!policyReady || policy === "closed")))
      return;
    setError("");
    const nextErrors: AuthErrors = {};
    if (signup && name.trim().length < 2)
      nextErrors.name = "Please enter your full name.";
    else if (signup && name.trim().length > 150)
      nextErrors.name = "Please use a shorter name.";
    if (!email.trim()) nextErrors.email = "Please enter your email address.";
    else if (
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    )
      nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Please enter your password.";
    else if (signup && password.length < 12)
      nextErrors.password = "Use at least 12 characters for your password.";
    else if (password.length > (signup ? 128 : 256))
      nextErrors.password = "Please use a shorter password.";
    if (signup && !confirmation)
      nextErrors.confirmation = "Please confirm your password.";
    else if (signup && password !== confirmation)
      nextErrors.confirmation = "Your passwords do not match.";
    if (signup && policy === "invite" && !invite.trim())
      nextErrors.invite = "Please enter your invitation code.";
    else if (signup && policy === "invite" && invite.trim().length > 256)
      nextErrors.invite = "Please check your invitation code.";
    setFieldErrors(nextErrors);
    const firstInvalid = (
      ["name", "email", "password", "confirmation", "invite"] as const
    ).find((field) => nextErrors[field]);
    if (firstInvalid) {
      const ids = {
        name: "full-name",
        email: "email",
        password: "password",
        confirmation: "confirm-password",
        invite: "invite",
      };
      document.getElementById(ids[firstInvalid])?.focus();
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
          ...(signup
            ? {
                name: name.trim(),
                ...(policy === "invite" ? { invite: invite.trim() } : {}),
              }
            : {}),
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
    policy,
    policyReady,
    invite,
    setInvite: (value: string) => {
      setInvite(value);
      clearField("invite");
    },
    name,
    setName: (value: string) => {
      setName(value);
      clearField("name");
    },
    email,
    setEmail: (value: string) => {
      setEmail(value);
      clearField("email");
    },
    password,
    setPassword: (value: string) => {
      setPassword(value);
      clearField("password");
    },
    confirmation,
    setConfirmation: (value: string) => {
      setConfirmation(value);
      clearField("confirmation");
    },
    showPassword,
    setShowPassword,
    error,
    fieldErrors,
    busy,
    submit,
    switchHref: `${signup ? "/sign-in" : "/create-account"}?returnTo=${encodeURIComponent(returnTo)}`,
  };
}
