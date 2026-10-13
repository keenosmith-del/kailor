import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router";
import type { Session } from "../../shared/src/index";
import { Analysis } from "./Analysis";
import { api, sessionHref } from "./api";
import { Canvas } from "./Canvas";
import { Conversation } from "./Conversation";
import { Discovery } from "./Discovery";
import type { Next } from "./types";
import { ErrorBox, errorMessage } from "./ui";
export function SessionPage() {
  const reduced = useReducedMotion();
  const { id = "", view = "discovery" } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null),
    [next, setNext] = useState<Next | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [processing, setProcessing] = useState("");
  const guest = window.location.pathname.startsWith("/preview/");
  const reload = useCallback(async () => {
    const [s, n] = await Promise.all([
      api<Session>(`/sessions/${id}`),
      api<Next>(`/sessions/${id}/next`),
    ]);
    setSession(s);
    setNext(n);
    const report = await api<{ stale: boolean }>(
      `/sessions/${id}/report`,
    ).catch(() => null);
    setReady(!!report && !report.stale);
  }, [id]);
  useEffect(() => {
    setSession(null);
    setReady(false);
    setError("");
    void reload().catch((e) => setError(errorMessage(e)));
  }, [reload]);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await reload();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      await reload().catch(() => {});
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function assess() {
    if (!session) return;
    setProcessing("Preparing your assessment…");
    const success = await act(() =>
      api(`/sessions/${id}/assessment`, "POST", { revision: session.revision }),
    );
    setProcessing("");
    if (!success) throw new Error("Assessment could not be prepared");
  }
  async function restart() {
    setProcessing("Opening a new discovery…");
    let newId: string | undefined;
    const success = await act(async () => {
      const s = await api<Session>(
        "/sessions",
        "POST",
        guest ? {} : { name: session?.subject.name ?? "New discovery" },
      );
      newId = s.id;
    });
    setProcessing("");
    if (success && newId) navigate(sessionHref(newId, "discovery"));
  }
  return (
    <main className={`session-shell view-${view}`}>
      <nav className="session-navigation" aria-label="Discovery views">
        <Link className="home-link" to="/">
          kailor
        </Link>
        <div>
          {["discovery", "conversation", "canvas", "report"].map((v) => (
            <NavLink key={v} to={sessionHref(id, v)}>
              {v === "report"
                ? "Analysis"
                : v === "canvas"
                  ? "Solution canvas"
                  : v[0].toUpperCase() + v.slice(1)}
            </NavLink>
          ))}
        </div>
        <button
          className="glass-button compact-button"
          disabled={busy}
          onClick={() => void restart()}
        >
          Start again
        </button>
      </nav>
      {guest && <p className="preview-note">Local guest preview</p>}
      <ErrorBox error={error} />
      {processing && (
        <p className="processing" role="status">
          {processing}
        </p>
      )}
      {session && next ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            className="session-view"
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -6 }}
            transition={{
              duration: reduced ? 0 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {view === "discovery" ? (
              <Discovery
                session={session}
                next={next}
                busy={busy}
                act={act}
                assess={assess}
                ready={ready}
              />
            ) : view === "conversation" ? (
              <Conversation session={session} busy={busy} act={act} />
            ) : view === "canvas" ? (
              <Canvas session={session} assess={assess} busy={busy} />
            ) : view === "report" ? (
              <Analysis session={session} assess={assess} busy={busy} />
            ) : (
              <p>Choose a discovery view.</p>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="loading">
          {error
            ? "Start a new discovery or try reloading."
            : "Gathering your context…"}
        </div>
      )}
    </main>
  );
}
