import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api } from "./api";
import { ErrorBox, errorMessage } from "./ui";
export type Account = { email: string; role: "admin" | "member" };
export function Auth({
  signup = false,
  onLogin,
}: {
  signup?: boolean;
  onLogin: (account: Account) => void;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = params.get("returnTo") ?? "/workspace";
  const returnTo = /^\/(?:workspace|plans(?:\/[^?#]*)?|sessions\/[^?#]+)$/.test(
    requested,
  )
    ? requested
    : "/workspace";
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [invite, setInvite] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [policy, setPolicy] = useState("invite");
  const pending = useRef(false);
  useEffect(() => {
    void api<{ registration: string }>("/auth/policy")
      .then((r) => setPolicy(r.registration))
      .catch(() => {});
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const account = await api<Account>(
        signup ? "/auth/register" : "/auth/login",
        "POST",
        {
          email: email.trim().toLowerCase(),
          password,
          ...(signup ? { invite } : {}),
        },
      );
      onLogin(account);
      navigate(returnTo, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const query = `?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <main className="auth-page">
      <section className="auth-brand">
        <Link className="auth-wordmark" to="/">
          kailor
        </Link>
        <p>A thoughtful place for what comes next.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <img
            src="/mascot/heads/kailor-head-neutral.png"
            width="96"
            height="96"
            alt=""
          />
          <h1>{signup ? "Create your account" : "Welcome back"}</h1>
          <p className="muted">
            {signup
              ? policy === "public"
                ? "A place to explore your ideas."
                : "Use your invitation to get started."
              : "Sign in to continue your plans."}
          </p>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                required
                minLength={signup ? 12 : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {signup && policy !== "public" && (
              <label>
                Invitation code
                <input
                  autoComplete="off"
                  required
                  value={invite}
                  maxLength={256}
                  onChange={(e) => setInvite(e.target.value)}
                />
              </label>
            )}
            {signup && (
              <p className="fine-print">
                Use at least 12 characters. Invitations are personal and expire
                after seven days.
              </p>
            )}
            <ErrorBox error={error} />
            <button
              className="button primary"
              disabled={busy || (signup && policy === "closed")}
            >
              {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="auth-switch">
            {signup ? "Already have an account?" : "Have an invitation?"}{" "}
            <Link
              className="text-link"
              to={`${signup ? "/sign-in" : "/create-account"}${query}`}
            >
              {signup ? "Sign in" : "Create account"}
            </Link>
          </p>
          <p className="fine-print">
            For account access or password recovery, contact the founder.
          </p>
        </div>
      </section>
    </main>
  );
}
