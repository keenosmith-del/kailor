import { ArrowRight, LogOut } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, Route, Routes } from "react-router";
import { api } from "./api";
import { Intro } from "./Intro";
import { SessionPage } from "./SessionPage";
import { ErrorBox, errorMessage } from "./ui";
import { Workspace } from "./Workspace";
export function App() {
  const [auth, setAuth] = useState<boolean | null>(null);
  useEffect(() => {
    api("/auth/me")
      .then(() => setAuth(true))
      .catch(() => setAuth(false));
  }, []);
  if (auth === null) return <div className="loading">Opening kailor…</div>;
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          kailor
        </Link>
        <span className="header-caption">
          a little clarity. a world of possibility.
        </span>
        {auth && (
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={() =>
              void api("/auth/logout", "POST").then(() => setAuth(false))
            }
          >
            <LogOut size={18} />
          </button>
        )}
      </header>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route
          path="/workspace"
          element={
            auth ? <Workspace /> : <Login onLogin={() => setAuth(true)} />
          }
        />
        <Route
          path="/sessions/:id/:view"
          element={
            auth ? <SessionPage /> : <Login onLogin={() => setAuth(true)} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer>
        thoughtfully considered. distinctly yours.
        <span>kailor · private consultant workspace</span>
      </footer>
    </>
  );
}
function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("founder@kailor.local"),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/auth/login", "POST", { email, password });
      onLogin();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="narrow login">
      <p className="eyebrow">private access</p>
      <h1>
        A thoughtful
        <br />
        place to begin.
      </h1>
      <p className="lead">Sign in to the kailor consultant workspace.</p>
      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <ErrorBox error={error} />
        <button className="button primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"} <ArrowRight size={18} />
        </button>
      </form>
    </main>
  );
}
