import { Link } from "react-router";
import { BrandWordmark } from "../../BrandWordmark/BrandWordmark";
import { PageBack } from "../PageBack/PageBack";
// Share only the original presentation. Authentication hooks and API clients
// must never be imported into this public, non-interactive account preview.
import "../../../pages/Auth/Auth.css";
import "./AccountAccess.css";

export function AccountAccess({ signup = false }: { signup?: boolean }) {
  return (
    <div
      className={`auth-page public-account-access ${signup ? "auth-page--signup" : "auth-page--signin"}`}
    >
      <div className="auth-back-position">
        <PageBack to="/" />
        <BrandWordmark withHead />
      </div>
      <section className="auth-panel" aria-labelledby="account-title">
        <div className="auth-container">
          <header className="auth-intro">
            <h1 id="account-title">
              {signup ? "Create account" : "Welcome back"}
            </h1>
            <p>
              {signup
                ? "Create an account to save your discoveries, revisit recommendations, and keep everything in one place."
                : "Sign in to continue your discoveries and access your saved work."}
            </p>
          </header>
          <div
            className="auth-form"
            role="group"
            aria-label={signup ? "Create account" : "Sign in"}
          >
            {signup && (
              <div className="auth-field">
                <label htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="off"
                  disabled
                />
              </div>
            )}
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="off"
                disabled
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-password">
                <input
                  id="password"
                  type="password"
                  placeholder={
                    signup ? "Create a password" : "Enter your password"
                  }
                  autoComplete="off"
                  disabled
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label="Show password"
                  disabled
                >
                  Show
                </button>
              </div>
            </div>
            {signup && (
              <div className="auth-field">
                <label htmlFor="confirm-password">Confirm password</label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  autoComplete="off"
                  disabled
                />
              </div>
            )}
            <button type="button" className="auth-submit" disabled>
              {!signup && (
                <img src="/svgs/profile.svg" alt="" width={17} height={17} />
              )}
              {signup ? "Create account" : "Sign in"}
            </button>
          </div>
          <div className="auth-secondary-actions">
            <button type="button" className="auth-secondary" disabled>
              <img src="/technology/github.svg" alt="" width={17} height={17} />
              Continue with GitHub
            </button>
          </div>
          <div className="auth-auth-switch">
            <span>{signup ? "Already have an account?" : "New here?"}</span>
            <Link replace to={signup ? "/sign-in" : "/create-account"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
