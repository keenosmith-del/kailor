import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { PlanItem, Session } from "../../../../shared/src/index";
import { api } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";
import "./GuestJourneyEntry.css";

type Entry = {
  current: {
    id: string;
    title: string;
    revision: number;
    lastSessionId: string | null;
  } | null;
  expiresAt: string | null;
};
export function GuestJourneyEntry() {
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry>();
  const [archived, setArchived] = useState<PlanItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const key = useRef(crypto.randomUUID());
  const cancel = useRef<HTMLButtonElement>(null);
  const start = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  async function loadArchives(cursor?: string) {
    const result = await api<{ plans: PlanItem[]; nextCursor: string | null }>(
      `/plans?archived=true${cursor ? `&cursor=${cursor}` : ""}`,
    );
    setArchived((old) => (cursor ? [...old, ...result.plans] : result.plans));
    setCursor(result.nextCursor);
  }
  useEffect(() => {
    let current = true;
    void api<Entry>("/guest/journeys")
      .then((data) => {
        if (!current) return;
        setEntry(data);
        if (data.expiresAt)
          void loadArchives().catch((e) => {
            if (current) setError(errorMessage(e));
          });
      })
      .catch((e) => {
        if (current) setError(errorMessage(e));
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    if (!confirm) {
      if (wasConfirming.current) start.current?.focus();
      wasConfirming.current = false;
      return;
    }
    wasConfirming.current = true;
    cancel.current?.focus();
    const footer = document.querySelector<HTMLElement>(".app-shell > footer");
    const previous = footer?.inert ?? false;
    const overflow = document.body.style.overflow;
    if (footer) footer.inert = true;
    document.body.style.overflow = "hidden";
    return () => {
      if (footer) footer.inert = previous;
      document.body.style.overflow = overflow;
    };
  }, [confirm]);
  const dismiss = () => {
    if (!pending.current) {
      setConfirm(false);
    }
  };
  async function begin(replace: boolean, view = "discovery") {
    if (!replace && entry?.current?.lastSessionId) {
      navigate(
        `/preview/${entry.current.lastSessionId}/${view}${view === "chat" ? "?welcome=coffee" : ""}`,
      );
      return;
    }
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result =
        replace && entry?.current
          ? await api<{ sessionId: string }>("/guest/journeys", "POST", {
              planId: entry.current.id,
              revision: entry.current.revision,
              creationKey: key.current,
              consent: true,
            })
          : await api<Session>("/guest/sessions", "POST", {});
      navigate(
        `/preview/${"sessionId" in result ? result.sessionId : result.id}/${view}${view === "chat" ? "?welcome=coffee" : ""}`,
        { replace: true },
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const project = entry?.current;
  return (
    <main className="guest-entry">
      <Link className="guest-entry-brand" inert={confirm} to="/">
        kailor
      </Link>
      <section aria-labelledby="guest-entry-title" inert={confirm}>
        <h1 id="guest-entry-title">Where would you like to begin?</h1>
        {!confirm && <ErrorBox error={error} />}
        <p>
          There's no need to have everything figured out. Choose how you'd like
          to explore with kailor.
        </p>
        {!entry ? (
          <p role="status">Opening guest journeys…</p>
        ) : (
          <>
            {project && (
              <p>
                Continue with <strong>{project.title}</strong>. Both paths share
                this project's context.
              </p>
            )}
            <div className="guest-entry-choices">
              <section>
                <h2>Start discovery</h2>
                <p>
                  A guided experience that helps us understand where you are,
                  what you're working towards, and where technology or new
                  opportunities could help.
                </p>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void begin(false, "discovery")}
                >
                  Start discovery
                </button>
              </section>
              <section>
                <h2>Coffee chat</h2>
                <p>
                  Prefer to talk things through? Have a relaxed conversation
                  with kailor about an idea, a challenge, or simply where to
                  begin.
                </p>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void begin(false, "chat")}
                >
                  Open Chat
                </button>
              </section>
            </div>
            {project && (
              <button
                ref={start}
                className="text-link"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Start a new guest journey
              </button>
            )}
          </>
        )}
        {entry?.expiresAt && (
          <p className="guest-expiry">
            Temporary access ends {new Date(entry.expiresAt).toLocaleString()}.
            Starting a new journey does not extend it. End the guest session to
            discard work now.
          </p>
        )}
        {archived.length > 0 && (
          <details>
            <summary>Archived guest journeys</summary>
            <p>
              Read and export these before guest access ends. To continue an
              archived project, open its Account page and transfer it before
              expiry. A transfer ends access to every remaining guest journey.
            </p>
            {archived.map(
              (plan) =>
                plan.lastSessionId && (
                  <Link
                    className="archived-journey"
                    key={plan.id}
                    to={`/preview/${plan.lastSessionId}/analysis`}
                  >
                    {plan.title}
                    <span>View reports and exports</span>
                  </Link>
                ),
            )}
            {cursor && (
              <button
                className="text-link"
                onClick={() =>
                  void loadArchives(cursor).catch((e) =>
                    setError(errorMessage(e)),
                  )
                }
              >
                Older journeys
              </button>
            )}
          </details>
        )}
      </section>
      {confirm && (
        <div
          className="guest-confirm-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) dismiss();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-confirm-title"
            className="guest-confirm"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                dismiss();
              }
              if (event.key === "Tab") {
                const nodes = Array.from(
                  event.currentTarget.querySelectorAll<HTMLButtonElement>(
                    "button:not(:disabled)",
                  ),
                );
                if (!nodes.length) {
                  event.preventDefault();
                  return;
                }
                if (event.shiftKey && document.activeElement === nodes[0]) {
                  event.preventDefault();
                  nodes.at(-1)?.focus();
                } else if (
                  !event.shiftKey &&
                  document.activeElement === nodes.at(-1)
                ) {
                  event.preventDefault();
                  nodes[0]?.focus();
                }
              }
            }}
          >
            <h2 id="guest-confirm-title">Begin a fresh guest journey?</h2>
            <p>
              “{project?.title}” will be archived, with its conversations,
              answers, sources and reports retained for reading and PDF export
              until this browser’s guest access expires. It will no longer be
              editable here.
            </p>
            <p>
              The new project starts with no answers, Chat, confirmed facts,
              sources or assessments. Your profile preferences stay. Only one
              guest project can be active.
            </p>
            <p>
              Archived journeys are available on this page. To keep a project
              permanently, cancel and use its Account page to transfer it first.
              Transfer ends guest access, including other archived journeys.
              Starting again does not extend the original 24 hours.
            </p>
            <ErrorBox error={error} />
            <div className="actions">
              <button
                ref={cancel}
                className="button"
                disabled={busy}
                onClick={dismiss}
              >
                Cancel
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => void begin(true)}
              >
                {busy ? "Starting…" : "Archive and start fresh"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
