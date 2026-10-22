import { useEffect } from "react";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import "./Auth.css";
import { PageBack } from "../../components/public/PageBack/PageBack";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import type { Account } from "../../types/account";
import { useAuthentication } from "./useAuthentication";

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
  const disabled = auth.busy || auth.guest.busy;
  return (
    <main className="auth-page">
      <div className="auth-back-position">
        <PageBack />
        <Link to="/" className="auth-wordmark">
          kailor
        </Link>
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
              onSubmit={auth.submit}
              aria-busy={auth.busy}
            >
              {signup && (
                <div className="auth-field">
                  <label htmlFor="full-name">Full name</label>
                  <input
                    id="full-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={150}
                    required
                    disabled={disabled}
                    value={auth.name}
                    onChange={(e) => auth.setName(e.target.value)}
                  />
                </div>
              )}
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="username"
                  maxLength={254}
                  required
                  disabled={disabled}
                  value={auth.email}
                  onChange={(e) => auth.setEmail(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-password">
                  <input
                    id="password"
                    name="password"
                    type={auth.showPassword ? "text" : "password"}
                    placeholder={
                      signup ? "Create a password" : "Enter your password"
                    }
                    autoComplete={signup ? "new-password" : "current-password"}
                    minLength={signup ? 12 : 1}
                    maxLength={128}
                    required
                    disabled={disabled}
                    value={auth.password}
                    onChange={(e) => auth.setPassword(e.target.value)}
                    aria-describedby={
                      signup ? "password-requirements" : undefined
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
                    name="confirmPassword"
                    type={auth.showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    disabled={disabled}
                    value={auth.confirmation}
                    onChange={(e) => auth.setConfirmation(e.target.value)}
                  />
                </div>
              )}
              {(auth.error || auth.guest.error) && (
                <ErrorBox
                  className="auth-status"
                  error={auth.error || auth.guest.error}
                />
              )}
              {signup && auth.policy === "invite" && (
                <div className="auth-field">
                  <label htmlFor="invite">Invitation code</label>
                  <input
                    id="invite"
                    autoComplete="off"
                    type="text"
                    required
                    value={auth.invite}
                    onChange={(event) => auth.setInvite(event.target.value)}
                    disabled={disabled}
                  />
                  <p>Use the invitation sent for your email address.</p>
                </div>
              )}
              <button type="submit" className="auth-submit" disabled={disabled}>
                {auth.busy
                  ? "Please wait…"
                  : signup
                    ? "Create account"
                    : "Sign in"}
              </button>
              {auth.guestEnabled && (
                <button
                  type="button"
                  className="auth-secondary"
                  disabled={disabled}
                  onClick={() => void auth.guest.start()}
                >
                  {auth.guest.busy
                    ? "Opening discovery…"
                    : "Continue without account"}
                </button>
              )}
            </form>
          )}
          <div className="auth-auth-switch">
            <span>
              {signup ? "Already have an account?" : "New to kailor?"}
            </span>
            <Link
              to={auth.switchHref}
              aria-disabled={disabled}
              onClick={(event) => {
                if (disabled) event.preventDefault();
              }}
            >
              {signup ? "Sign in" : "Create account"}
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
