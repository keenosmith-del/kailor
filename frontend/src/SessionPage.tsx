import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router";
import type { Session } from "../../shared/src/index";
import { Analysis } from "./Analysis";
import { api, sessionHref } from "./api";
import { Canvas } from "./Canvas";
import { Conversation } from "./Conversation";
import { Discovery } from "./Discovery";
import type { Next } from "./types";
import { ErrorBox, errorMessage } from "./ui";
async function readSession(id: string) {
  const [session, next, report] = await Promise.all([
    api<Session>(`/sessions/${id}`),
    api<Next>(`/sessions/${id}/next`),
    api<{ stale: boolean }>(`/sessions/${id}/report`).catch(() => null),
  ]);
  return { session, next, ready: !!report && !report.stale };
}

function SessionTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const present = useIsPresent();
  return (
    <motion.div
      className="session-view"
      aria-hidden={!present}
      inert={!present}
      initial={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduced ? 0 : -6, scale: reduced ? 1 : 1.01 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SessionPage() {
  const reduced = useReducedMotion();
  const { id = "", view = "discovery" } = useParams();
  const navigate = useNavigate();
  const loadedSessionId = useRef("");
  const restartPending = useRef(false);
  const [restarting, setRestarting] = useState(false);
  const [session, setSession] = useState<Session | null>(null),
    [next, setNext] = useState<Next | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [processing, setProcessing] = useState("");
  const guest = window.location.pathname.startsWith("/preview/");
  const reload = useCallback(async () => {
    const data = await readSession(id);
    loadedSessionId.current = id;
    setSession(data.session);
    setNext(data.next);
    setReady(data.ready);
  }, [id]);
  useEffect(() => {
    if (loadedSessionId.current === id) return;
    setError("");
    void reload().catch((e) => setError(errorMessage(e)));
  }, [id, reload]);
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
    if (busy || restartPending.current) return;
    restartPending.current = true;
    setRestarting(true);
    setBusy(true);
    setError("");
    try {
      const created = await api<Session>(
        "/sessions",
        "POST",
        guest ? {} : { name: session?.subject.name ?? "New discovery" },
      );
      const data = await readSession(created.id);
      // Keep the old page present until the new session is ready for a crossfade.
      loadedSessionId.current = created.id;
      setSession(data.session);
      setNext(data.next);
      setReady(data.ready);
      navigate(sessionHref(created.id, "discovery"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      restartPending.current = false;
      setRestarting(false);
      setBusy(false);
    }
  }
  return (
    <main className={`session-shell view-${view}`}>
      <nav className="session-navigation" aria-label="Discovery views">
        <Link className="home-link" to="/">
          kailor
        </Link>
        <div>
          {["discovery", "conversation", "canvas", "report"].map((v) => (
            <NavLink
              key={v}
              className="session-nav-link"
              to={sessionHref(id, v)}
            >
              {v === "report"
                ? "Analysis"
                : v === "canvas"
                  ? "Solution canvas"
                  : v[0].toUpperCase() + v.slice(1)}
            </NavLink>
          ))}
        </div>
        <motion.button
          className="glass-button compact-button answer-control"
          whileHover={busy || reduced ? undefined : { y: -2, scale: 1.015 }}
          whileTap={busy || reduced ? undefined : { scale: 0.94 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          aria-label={restarting ? "Starting a new discovery" : "Start again"}
          disabled={busy}
          onClick={() => void restart()}
        >
          <motion.span
            aria-hidden="true"
            animate={{ rotate: restarting && !reduced ? -360 : 0 }}
            transition={{ duration: reduced ? 0 : 0.5 }}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
          </motion.span>
          Start again
        </motion.button>
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
          <SessionTransition key={`${session.id}:${view}`}>
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
          </SessionTransition>
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
