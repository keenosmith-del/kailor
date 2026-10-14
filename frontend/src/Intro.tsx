import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { useRef, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { Session } from "../../shared/src/index";
import { api } from "./api";
import { Mascot } from "./Mascot";
import { ErrorBox, errorMessage } from "./ui";
function Scene({ index, children }: { index: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const present = useIsPresent();
  return (
    <motion.section
      className={`intro-scene scene-${index + 1}`}
      aria-label={`Introduction scene ${index + 1}`}
      aria-hidden={!present}
      style={{ zIndex: present ? 1 : 2 }}
      initial={{ opacity: 0, y: reduced ? 0 : 14, scale: reduced ? 1 : 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduced ? 0 : -5, scale: reduced ? 1 : 1.005 }}
      transition={{ duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="scene-composition">{children}</div>
    </motion.section>
  );
}
export function Intro() {
  const reduced = useReducedMotion();
  const [activeScene, setActiveScene] = useState(0);
  const activeSceneRef = useRef(activeScene);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  activeSceneRef.current = activeScene;
  function moveScene(direction: number) {
    const next = Math.max(0, Math.min(2, activeSceneRef.current + direction));
    if (next === activeSceneRef.current || locked.current) return;
    locked.current = true;
    activeSceneRef.current = next;
    setActiveScene(next);
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(
      () => {
        locked.current = false;
      },
      reduced ? 150 : 650,
    );
  }
  useEffect(() => {
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX))
        return;
      event.preventDefault();
      if (Math.abs(event.deltaY) < 8) return;
      moveScene(Math.sign(event.deltaY));
    };
    window.addEventListener("wheel", wheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", wheel);
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    };
  }, [reduced]);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function enter() {
    setBusy(true);
    setError("");
    try {
      const session = await api<Session>("/guest/sessions", "POST", {});
      navigate(`/preview/${session.id}/discovery`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="intro-experience">
      <nav className="intro-account-controls" aria-label="Account controls">
        <button aria-disabled="true" title="Public sign-in coming soon">
          Sign in <span>coming soon</span>
        </button>
        <button aria-disabled="true" title="Public accounts coming soon">
          Create account <span>coming soon</span>
        </button>
      </nav>
      <div
        className="intro"
        tabIndex={0}
        aria-label="Introduction scenes"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch)
            touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const touch = event.changedTouches[0];
          touchStart.current = null;
          if (!start || !touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx))
            moveScene(dy < 0 ? 1 : -1);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (["ArrowDown", "PageDown", " "].includes(event.key)) {
            event.preventDefault();
            moveScene(1);
          } else if (["ArrowUp", "PageUp"].includes(event.key)) {
            event.preventDefault();
            moveScene(-1);
          }
        }}
      >
        <AnimatePresence mode="sync" initial={false}>
          {activeScene === 0 && (
            <Scene key={0} index={0}>
              <div className="intro-copy">
                <h1 className="intro-primary-brand">k ᐧ ai ᐧ lor</h1>
                <p>
                  Whether you're starting something new, improving your online presence, or reclaiming time from repetitive work, kailor helps identify where technology can make a meaningful difference — <strong>and what's worth doing first.</strong>
                </p>
              </div>
              <div className="intro-mascot">
                <Mascot state="greeting" variant="head" />
              </div>
            </Scene>
          )}
          {activeScene === 1 && (
            <Scene key={1} index={1}>
              <div className="intro-copy">
                <h1>
                  Use guided discovery or conversation to explain what you’re
                  doing, what you already have, and where you need help.
                </h1>
                <p>
                  kailor gathers context, identifies opportunities, and prepares
                  a structured assessment.
                </p>
              </div>
            </Scene>
          )}
          {activeScene === 2 && (
            <Scene key={2} index={2}>
              <div className="intro-copy">
                <h1>
                  Get analysis, recommendations, and practical next steps based
                  on your situation.
                </h1>
                <p>
                  Explore ideas, websites, portfolios, automations,
                  applications, integrations, and other possible solutions.
                </p>
                <button
                  className="glass-button start-button"
                  disabled={busy}
                  onClick={() => void enter()}
                >
                  {busy ? "Opening discovery…" : "Start Discovery"}
                </button>
              </div>
            </Scene>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <div className="entry-error">
          <ErrorBox error={error} />
          <button
            className="glass-button"
            disabled={busy}
            onClick={() => void enter()}
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
