import { BrandWordmark } from "../../components/BrandWordmark/BrandWordmark";
import { useEffect } from "react";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import "./Auth.css";
import { PageBack } from "../../components/public/PageBack/PageBack";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import type { Account } from "../../types/account";
import { useAuthentication } from "./useAuthentication";

function AuthFieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span id={id} className="auth-field-error" role="alert">
      {message}
    </span>
  ) : null;
}
export function Auth({
  signup = false,
  onLogin,
}: {
  signup?: boolean;
  onLogin: (account: Account) => void;
}) {
  const auth = useAuthentication(signup, onLogin);
  useEffect(() => {
    document.documentElement.classList.remove("no-js");
  }, []);
  const reducedMotion = useReducedMotion();
  const restricted = signup && (!auth.policyReady || auth.policy === "closed");
  const disabled = auth.busy;
  return (
    <main
      className={`auth-page ${signup ? "auth-page--signup" : "auth-page--signin"}`}
    >
      <div className="auth-back-position">
        <PageBack to="/" />
        <BrandWordmark withHead />
      </div>
      <section className="auth-panel">
        <motion.div
          className="auth-container"
          key={signup ? "signup" : "signin"}
          initial={reducedMotion ? false : { opacity: 0.4, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="auth-intro">
            <h1>{signup ? "Create account" : "Welcome back"}</h1>
            <p>
              {signup
                ? "Create an account to save your discoveries, revisit recommendations, and keep everything in one place."
                : "Sign in to continue your discoveries and access your saved work."}
            </p>
          </header>
          {restricted ? (
            <div className="auth-restriction" role="status">
              <p>
                {auth.policyReady
                  ? "Account creation is restricted while kailor is in controlled testing. Existing approved users can still sign in."
                  : "Checking registration availability…"}
              </p>
              <a href="mailto:keenosmith@kailor.co.za">
                Contact keenosmith@kailor.co.za
              </a>
            </div>
          ) : (
            <form
              className="auth-form"
              noValidate
              onSubmit={auth.submit}
              aria-busy={auth.busy}
            >
              {signup && (
                <div className="auth-field">
                  <label htmlFor="full-name">Full name</label>
                  <input
                    id="full-name"
                    aria-required="true"
                    aria-invalid={Boolean(auth.fieldErrors.name)}
                    aria-describedby={
                      auth.fieldErrors.name ? "auth-name-error" : undefined
                    }
                    name="name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    maxLength={150}
                    disabled={disabled}
                    value={auth.name}
                    onChange={(e) => auth.setName(e.target.value)}
                  />
                  <AuthFieldError
                    id="auth-name-error"
                    message={auth.fieldErrors.name}
                  />
                </div>
              )}
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  aria-required="true"
                  aria-invalid={Boolean(auth.fieldErrors.email)}
                  aria-describedby={
                    auth.fieldErrors.email ? "auth-email-error" : undefined
                  }
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="username"
                  maxLength={254}
                  disabled={disabled}
                  value={auth.email}
                  onChange={(e) => auth.setEmail(e.target.value)}
                />
                <AuthFieldError
                  id="auth-email-error"
                  message={auth.fieldErrors.email}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-password">
                  <input
                    id="password"
                    aria-required="true"
                    aria-invalid={Boolean(auth.fieldErrors.password)}
                    name="password"
                    type={auth.showPassword ? "text" : "password"}
                    placeholder={
                      signup ? "Create a password" : "Enter your password"
                    }
                    autoComplete={signup ? "new-password" : "current-password"}
                    maxLength={signup ? 128 : 256}
                    disabled={disabled}
                    value={auth.password}
                    onChange={(e) => auth.setPassword(e.target.value)}
                    aria-describedby={
                      [
                        signup ? "password-requirements" : "",
                        auth.fieldErrors.password ? "auth-password-error" : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => auth.setShowPassword(!auth.showPassword)}
                    disabled={disabled}
                    aria-label={
                      auth.showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {auth.showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <AuthFieldError
                  id="auth-password-error"
                  message={auth.fieldErrors.password}
                />
                {signup && (
                  <span id="password-requirements" className="sr-only">
                    Use at least 12 characters.
                  </span>
                )}
              </div>
              {signup && (
                <div className="auth-field">
                  <label htmlFor="confirm-password">Confirm password</label>
                  <input
                    id="confirm-password"
                    aria-required="true"
                    aria-invalid={Boolean(auth.fieldErrors.confirmation)}
                    aria-describedby={
                      auth.fieldErrors.confirmation
                        ? "auth-confirmation-error"
                        : undefined
                    }
                    name="confirmPassword"
                    type={auth.showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    maxLength={128}
                    disabled={disabled}
                    value={auth.confirmation}
                    onChange={(e) => auth.setConfirmation(e.target.value)}
                  />
                  <AuthFieldError
                    id="auth-confirmation-error"
                    message={auth.fieldErrors.confirmation}
                  />
                </div>
              )}
              {auth.error && (
                <ErrorBox className="auth-status" error={auth.error} />
              )}
              {signup && auth.policy === "invite" && (
                <div className="auth-field">
                  <label htmlFor="invite">Invitation code</label>
                  <input
                    id="invite"
                    aria-required="true"
                    aria-invalid={Boolean(auth.fieldErrors.invite)}
                    aria-describedby={
                      auth.fieldErrors.invite ? "auth-invite-error" : undefined
                    }
                    autoComplete="off"
                    type="text"
                    value={auth.invite}
                    onChange={(event) => auth.setInvite(event.target.value)}
                    disabled={disabled}
                  />
                  <AuthFieldError
                    id="auth-invite-error"
                    message={auth.fieldErrors.invite}
                  />
                  <p>Use the invitation sent for your email address.</p>
                </div>
              )}
              <button type="submit" className="auth-submit" disabled={disabled}>
                {!signup && (
                  <img src="/svgs/profile.svg" alt="" width={17} height={17} />
                )}
                {auth.busy
                  ? "Please wait…"
                  : signup
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
          )}
          <div className="auth-secondary-actions">
            <button
              type="button"
              className="auth-secondary"
              disabled
              aria-describedby="auth-github-availability"
              title="GitHub sign-in is not available yet."
            >
              <img src="/technology/github.svg" alt="" width={17} height={17} />
              Continue with GitHub
            </button>
            <span id="auth-github-availability" className="sr-only">
              GitHub sign-in is not available yet.
            </span>
            <button
              type="button"
              className="auth-secondary"
              disabled
              aria-describedby="auth-guest-availability"
            >
              Continue without account
            </button>
            <span id="auth-guest-availability" className="sr-only">
              Guest access is unavailable during controlled testing.
            </span>
          </div>
          <div className="auth-auth-switch">
            <span>{signup ? "Already have an account?" : "New here?"}</span>
            <Link
              to={auth.switchHref}
              aria-disabled={disabled}
              onClick={(event) => {
                if (disabled) event.preventDefault();
              }}
            >
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
