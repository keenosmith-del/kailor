import "./Auth.css";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import type { Account } from "../../types/account";
import { useAuthentication } from "./useAuthentication";

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.85 10.91.58.11.79-.25.79-.56v-2.17c-3.19.7-3.86-1.35-3.86-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18A10.97 10.97 0 0 1 12 6.32c.97 0 1.95.13 2.86.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.77 1.03.77 2.08v3.08c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
export function Auth({
  signup = false,
  onLogin,
}: {
  signup?: boolean;
  onLogin: (account: Account) => void;
}) {
  const auth = useAuthentication(signup, onLogin);
  const disabled = auth.busy || auth.guest.busy;
  return (
    <main className="auth-page">
      <section className="auth-brand" aria-label="kailor">
        <Link className="auth-back" to="/">
          <ArrowLeft size={14} aria-hidden="true" />
          Back
        </Link>
        <div className="auth-brand-content">
          <img
            className="auth-mascot"
            src="/mascot/poses/kailor-unamused.png"
            alt="kailor"
            width="150"
            height="150"
          />
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-container">
          <header className="auth-intro">
            <h1>k ᐧ ai ᐧ lor</h1>
            <p>
              {signup
                ? "Create an account to save your discoveries, revisit recommendations, and keep everything in one place."
                : "Sign in to continue your discoveries and access your saved work."}
            </p>
          </header>
          <form className="auth-form" onSubmit={auth.submit}>
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
              <p className="auth-status error" role="alert">
                {auth.error || auth.guest.error}
              </p>
            )}
            <button type="submit" className="auth-submit" disabled={disabled}>
              {auth.busy
                ? "Please wait…"
                : signup
                  ? "Create account"
                  : "Sign in"}
            </button>
            <button
              type="button"
              className="auth-secondary"
              disabled
              aria-describedby="github-unavailable"
              title="GitHub sign-in is not available yet."
            >
              <GitHubIcon />
              <span>Continue with GitHub</span>
            </button>
            <p id="github-unavailable" className="sr-only">
              GitHub sign-in is not available yet.
            </p>
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
          </form>
          <div className="auth-auth-switch">
            <span>
              {signup ? "Already have an account?" : "New to kailor?"}
            </span>
            <Link to={auth.switchHref}>
              {signup ? "Sign in" : "Create account"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
