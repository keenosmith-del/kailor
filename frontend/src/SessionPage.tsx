import { PlanNavigation } from "./Plans";
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
import { pruneDrafts } from "./drafts";
async function readSession(id: string) {
  const [session, next, report] = await Promise.all([
    api<Session>(`/sessions/${id}`),
    api<Next>(`/sessions/${id}/next`),
    api<{ stale: boolean }>(`/sessions/${id}/report`).catch(() => null),
  ]);
  if (session.revision !== next.revision)
    throw new Error(
      "This session changed while loading. Please reload to see the current question.",
    );
  return {
    session,
    next,
    ready: !!report && !report.stale && next.readiness.canAssess,
  };
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
  const restartKey = useRef(crypto.randomUUID());
  const loadSequence = useRef(0);
  const currentRoute = useRef(id);
  currentRoute.current = id;
  const [restarting, setRestarting] = useState(false);
  const [session, setSession] = useState<Session | null>(null),
    [next, setNext] = useState<Next | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [processing, setProcessing] = useState("");
  useEffect(() => {
    pruneDrafts();
    const timer = window.setInterval(pruneDrafts, 60_000);
    window.addEventListener("pageshow", pruneDrafts);
    document.addEventListener("visibilitychange", pruneDrafts);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pageshow", pruneDrafts);
      document.removeEventListener("visibilitychange", pruneDrafts);
    };
  }, []);
  const guest = window.location.pathname.startsWith("/preview/");
  const reload = useCallback(async () => {
    const sequence = ++loadSequence.current;
    const data = await readSession(id);
    if (sequence !== loadSequence.current || currentRoute.current !== id)
      return;
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
  async function act(
    fn: () => Promise<unknown>,
    onError?: (error: unknown) => boolean,
  ) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await reload();
      return true;
    } catch (e) {
      if (!onError?.(e)) setError(errorMessage(e));
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
      const result =
        session?.planId && session.plan
          ? await api<{ sessionId: string }>(
              `/plans/${session.planId}/sessions`,
              "POST",
              {
                revision: session.plan.revision,
                creationKey: restartKey.current,
              },
            )
          : null;
      const created = result
        ? { id: result.sessionId }
        : await api<Session>(
            "/sessions",
            "POST",
            guest ? {} : { name: session?.subject.name ?? "New discovery" },
          );
      const data = await readSession(created.id);
      restartKey.current = crypto.randomUUID();
      // Keep the previous discovery and its scoped draft available when returning.
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
          aria-label={
            restarting
              ? "Starting a new discovery"
              : "New discovery in this plan"
          }
          disabled={busy || !!session?.plan?.archivedAt}
          onClick={() => void restart()}
        >
          <motion.span
            aria-hidden="true"
            animate={{ rotate: restarting && !reduced ? -360 : 0 }}
            transition={{ duration: reduced ? 0 : 0.5 }}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
          </motion.span>
          New discovery
        </motion.button>
      </nav>
      {session?.id === id && (
        <PlanNavigation
          sessionId={id}
          planId={session.planId}
          title={session.plan?.title ?? session.subject.name}
          busy={busy}
          onChange={() => void reload()}
        />
      )}
      {session?.plan?.archivedAt && (
        <p className="preview-note">
          This plan is archived. Its history is available; restore it under
          Change plan to continue.
        </p>
      )}
      {guest && <p className="preview-note">Local guest preview</p>}
      <ErrorBox error={error} />
      {processing && (
        <p className="processing" role="status">
          {processing}
        </p>
      )}
      {session && next && session.id === id ? (
        <AnimatePresence mode="wait" initial={false}>
          <SessionTransition key={`${session.id}:${view}`}>
            <fieldset
              className="session-content"
              disabled={!!session.plan?.archivedAt}
            >
              {view === "discovery" ? (
                <Discovery
                  session={session}
                  next={next}
                  busy={busy}
                  act={act}
                  assess={assess}
                  ready={ready}
                  restart={restart}
                />
              ) : view === "conversation" ? (
                <Conversation
                  assess={assess}
                  ready={ready}
                  session={session}
                  next={next}
                  busy={busy}
                  act={act}
                />
              ) : view === "canvas" ? (
                <Canvas
                  session={session}
                  next={next}
                  assess={assess}
                  busy={busy}
                />
              ) : view === "report" ? (
                <Analysis
                  session={session}
                  next={next}
                  assess={assess}
                  busy={busy}
                />
              ) : (
                <p>Choose a discovery view.</p>
              )}
            </fieldset>
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
