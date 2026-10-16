import "./SessionPage.css";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Session } from "../../../../shared/src/index";
import { Analysis } from "../Analysis/Analysis";
import { ProjectReports } from "../Application/ProjectReports";
import { api, sessionHref } from "../../services/api";
import { Canvas } from "../Canvas/Canvas";
import { Conversation } from "../Conversation/Conversation";
import { Discovery } from "../Discovery/Discovery";
import type { Next } from "../../types/session";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";
import { clearDrafts, pruneDrafts } from "../../utils/drafts";
async function readSession(id: string) {
  const [session, next, report] = await Promise.all([
    api<Session>(`/sessions/${id}`),
    api<Next>(`/sessions/${id}/next`),
    api<{ stale: boolean }>(`/sessions/${id}/report-status`).catch(() => null),
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SessionPage({
  sessionId: id,
  activeView,
  onSession,
  initialMessage,
  onInitialMessageConsumed,
  onNewConversation,
  onProjectChange,
  onNewProject,
}: {
  sessionId: string;
  activeView: string;
  onSession: (session: Session) => void;
  initialMessage: string;
  onInitialMessageConsumed: () => void;
  onNewConversation: () => Promise<void>;
  onProjectChange: () => void;
  onNewProject?: () => void;
}) {
  const view =
    activeView === "chat"
      ? "conversation"
      : activeView === "analysis"
        ? "report"
        : activeView;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loadedSessionId = useRef("");
  const loadSequence = useRef(0);
  const currentRoute = useRef(id);
  currentRoute.current = id;
  const [restarting, setRestarting] = useState(false);
  const [reportVersion, setReportVersion] = useState(0);
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
  const reload = useCallback(async () => {
    const sequence = ++loadSequence.current;
    const data = await readSession(id);
    if (sequence !== loadSequence.current || currentRoute.current !== id)
      return;
    loadedSessionId.current = id;
    setSession(data.session);
    onSession(data.session);
    setNext(data.next);
    setReady(data.ready);
  }, [id]);
  useEffect(() => {
    const changed = (event: Event) => {
      if ((event as CustomEvent<string>).detail === id)
        void reload().catch((e) => setError(errorMessage(e)));
    };
    window.addEventListener("kailor:session-changed", changed);
    return () => window.removeEventListener("kailor:session-changed", changed);
  }, [id, reload]);
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
    setReportVersion((version) => version + 1);
  }
  async function restart() {
    if (!session || busy) return;
    setRestarting(true);
  }
  async function confirmRestart() {
    if (!session || busy) return;
    const success = await act(() =>
      api(`/sessions/${id}/discovery/restart`, "POST", {
        revision: session.revision,
      }),
    );
    if (success) {
      clearDrafts(id);
      setRestarting(false);
      onProjectChange();
    }
  }
  return (
    <section className={`session-shell view-${view}`} aria-label={activeView}>
      {restarting && (
        <ConfirmDialog
          title="Begin Discovery again?"
          confirmLabel="Start from beginning"
          busy={busy}
          error={error}
          onClose={() => setRestarting(false)}
          onConfirm={() => void confirmRestart()}
        >
          <p>
            Your guided answers will be cleared so you can explore from the
            first question.
          </p>
          <p>
            Chat-confirmed details, conversations, sources and saved reports
            stay in this project.
          </p>
        </ConfirmDialog>
      )}
      {session?.plan?.archivedAt && (
        <p className="notice">
          This project is archived. Its saved history is available.{" "}
          <Link
            to={
              window.location.pathname.startsWith("/preview/")
                ? "/preview/discovery"
                : "/plans"
            }
          >
            {window.location.pathname.startsWith("/preview/")
              ? "Guest journeys"
              : "Manage projects to restore it"}
          </Link>
        </p>
      )}
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
              disabled={
                !!session.plan?.archivedAt &&
                !["report", "sources"].includes(view)
              }
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
                  onNewProject={onNewProject}
                />
              ) : view === "conversation" ? (
                <Conversation
                  assess={assess}
                  ready={ready}
                  session={session}
                  next={next}
                  busy={busy}
                  act={act}
                  initialMessage={initialMessage}
                  onInitialMessageConsumed={onInitialMessageConsumed}
                />
              ) : view === "canvas" ? (
                <Canvas
                  onChanged={reload}
                  session={session}
                  next={next}
                  assess={assess}
                  busy={busy}
                />
              ) : view === "sources" ? (
                <ProjectReports session={session} sources />
              ) : view === "report" ? (
                <div className="analysis-page">
                  <Analysis
                    session={session}
                    next={next}
                    assess={assess}
                    busy={busy}
                  />
                  {!searchParams.get("report") && (
                    <ProjectReports
                      session={session}
                      refreshVersion={reportVersion}
                    />
                  )}
                </div>
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
    </section>
  );
}
