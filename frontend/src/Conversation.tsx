import { ArrowRight, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { Mascot } from "./Mascot";
import { Link } from "react-router";
import { conversationSuggestions } from "../../shared/src/conversation";
import { api, sessionHref } from "./api";
import type { SessionProps, Next } from "./types";
import { readDraft, saveDraft } from "./drafts";
export function Conversation({
  session,
  busy,
  act,
  next,
  assess,
  ready,
}: SessionProps & { next: Next; assess: () => Promise<void>; ready: boolean }) {
  const labels: Record<string, string> = {
    industry: "Activity",
    goals: "Objective",
    constraints: "Constraints",
    budget: "Investment",
    presence: "Current channels",
    tools: "Tools and workflow",
    websiteStatus: "Website status",
    bookingStatus: "Booking provider",
    aiPreference: "AI preference",
    automationPreference: "Automation preference",
    websitePreference: "Website preference",
    clarification: "Clarification",
    request: "Requirement",
  };
  const displayValue = (
    key: string,
    value: import("../../shared/src/index").AnswerValue,
  ) =>
    Array.isArray(value)
      ? value.join(", ")
      : value === "absent" && key.endsWith("Status")
        ? key === "websiteStatus"
          ? "No current website"
          : "No current booking provider"
        : value === "existing" && key.endsWith("Status")
          ? key === "websiteStatus"
            ? "An existing website"
            : "An existing booking provider"
          : value;
  const [message, setMessage] = useState(""),
    [mode, setMode] = useState("conversation");
  const sending = useRef(false);
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const followBottom = useRef(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const suggestions = conversationSuggestions(next, session.messages);
  useEffect(() => {
    if (followBottom.current && history.current)
      history.current.scrollTop = history.current.scrollHeight;
  }, [session.messages.length, busy]);
  useEffect(() => {
    setMessage(
      String(
        readDraft(
          session.id,
          session.knowledgeRevision ?? session.revision,
          "conversation",
        ) ?? "",
      ),
    );
  }, [session.id]);
  function draft(text: string) {
    setMessage(text);
    saveDraft(
      session.id,
      session.knowledgeRevision ?? session.revision,
      "conversation",
      text,
    );
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!message.trim() || busy || sending.current) return;
    sending.current = true;
    try {
      await act(async () => {
        const response = await api<{
          provider: string;
          fallbackReason: string | null;
        }>(`/sessions/${session.id}/chat`, "POST", {
          revision: session.revision,
          message,
          mode,
        });
        setNotice(
          response.provider === "mock-development"
            ? "This reply uses local guidance. Model assistance is unavailable or disabled for this turn."
            : "",
        );
        draft("");
      });
    } finally {
      sending.current = false;
      input.current?.focus();
    }
  }
  return (
    <div className="conversation-layout">
      <aside className="conversation-mascot">
        <Mascot
          state={
            busy
              ? "thinking"
              : ready
                ? "completed"
                : next.readiness.canAssess
                  ? "recommendation"
                  : "conversation"
          }
        />
      </aside>
      <div className="conversation">
        <div className="conversation-heading">
          <h1>Let’s talk it through.</h1>
          <p className="muted">
            Explore an idea, explain a workflow, or work toward an assessment
            here.
          </p>
        </div>
        <div
          className="chat-history"
          aria-live="polite"
          ref={history}
          onScroll={() => {
            const element = history.current;
            if (element)
              followBottom.current =
                element.scrollHeight -
                  element.scrollTop -
                  element.clientHeight <
                80;
          }}
        >
          {!session.messages.length && (
            <div className="empty-chat">
              <MessageCircle size={26} />
              <p>What’s on your mind?</p>
              <div className="suggestions">
                {suggestions.map((p) => (
                  <button
                    key={p.message}
                    disabled={busy}
                    onClick={() => {
                      draft(p.message);
                      input.current?.focus();
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {session.messages.map((m) => (
            <article className={`message ${m.role}`} key={m.id}>
              <small>
                {m.role === "user"
                  ? "You"
                  : m.provider === "mock-development"
                    ? "kailor · local guidance"
                    : "kailor"}
              </small>
              <p>{m.content}</p>
            </article>
          ))}
          {busy && (
            <p className="muted" role="status">
              Saving and processing your request…
            </p>
          )}
        </div>
        {session.evidence.filter((e) => e.active && e.status === "inferred")
          .length > 1 && (
          <div className="actions">
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                void act(() =>
                  api(`/sessions/${session.id}/evidence`, "POST", {
                    revision: session.revision,
                    ids: session.evidence
                      .filter((e) => e.active && e.status === "inferred")
                      .slice(0, 8)
                      .map((e) => e.id),
                    accept: true,
                  }),
                )
              }
            >
              Confirm these details
            </button>
            <button
              className="text-link"
              disabled={busy}
              onClick={() =>
                void act(() =>
                  api(`/sessions/${session.id}/evidence`, "POST", {
                    revision: session.revision,
                    ids: session.evidence
                      .filter((e) => e.active && e.status === "inferred")
                      .slice(0, 8)
                      .map((e) => e.id),
                    accept: false,
                  }),
                )
              }
            >
              Dismiss these details
            </button>
          </div>
        )}
        {session.evidence
          .filter((e) => e.active && e.status === "inferred")
          .map((e) => (
            <div className="proposal" key={e.id}>
              <span className="confirmation-label">
                {e.provenance?.conflicts?.length
                  ? "Update your understanding"
                  : "Is this right?"}
              </span>
              {e.provenance?.conflicts?.map((c) => (
                <p className="muted" key={c.id}>
                  {c.message} Earlier: {c.previous.quote}
                </p>
              ))}
              <p>
                <strong>
                  {labels[e.key] ??
                    next.active.find((q) => q.id === e.key)?.title ??
                    e.key}
                  :
                </strong>{" "}
                {editing[e.id] !== undefined ? (
                  <input
                    aria-label={`Edit ${labels[e.key] ?? e.key}`}
                    value={editing[e.id]}
                    onChange={(event) =>
                      setEditing((previous) => ({
                        ...previous,
                        [e.id]: event.target.value,
                      }))
                    }
                  />
                ) : (
                  displayValue(e.key, e.value)
                )}
              </p>
              <div className="actions">
                <button
                  className="button"
                  disabled={busy}
                  onClick={() =>
                    void act(() =>
                      api(`/sessions/${session.id}/evidence/${e.id}`, "POST", {
                        revision: session.revision,
                        accept: true,
                        ...(editing[e.id] !== undefined
                          ? { value: editing[e.id] }
                          : {}),
                      }),
                    )
                  }
                >
                  {e.provenance?.conflicts?.length
                    ? "Confirm correction"
                    : "Confirm"}
                </button>
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() =>
                    void act(() =>
                      api(`/sessions/${session.id}/evidence/${e.id}`, "POST", {
                        revision: session.revision,
                        accept: false,
                      }),
                    )
                  }
                >
                  Dismiss
                </button>
                {typeof e.value === "string" &&
                  !e.key.endsWith("Status") &&
                  !e.key.endsWith("Preference") &&
                  !["stage", "kind"].includes(e.key) && (
                    <button
                      type="button"
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        setEditing((previous) => ({
                          ...previous,
                          [e.id]: String(e.value),
                        }))
                      }
                    >
                      Edit
                    </button>
                  )}
              </div>
            </div>
          ))}
        {!!session.messages.length && !!next.suggestedPrompts.length && (
          <div className="suggestions">
            {suggestions.map((p) => (
              <button
                key={p.message}
                disabled={busy}
                onClick={() => {
                  draft(p.message);
                  input.current?.focus();
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        {notice && (
          <p className="fine-print" role="status">
            {notice}
          </p>
        )}
        {next.readiness.canAssess && (
          <div className="conversation-readiness" role="status">
            <p>
              {ready
                ? "Your initial assessment is ready."
                : "I have enough information to prepare an initial assessment."}
            </p>
            <div className="actions">
              {ready ? (
                <Link className="button" to={sessionHref(session.id, "report")}>
                  Explore the analysis
                </Link>
              ) : (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void assess().catch(() => {})}
                >
                  Prepare assessment
                </button>
              )}
              <button
                className="text-link"
                disabled={busy}
                onClick={() => input.current?.focus()}
              >
                Continue conversation
              </button>
            </div>
          </div>
        )}
        <form className="chat-form" onSubmit={send}>
          <label className="sr-only" htmlFor="message">
            Your message
          </label>
          <textarea
            ref={input}
            id="message"
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229 &&
                window.matchMedia("(pointer: fine)").matches
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={4000}
            rows={3}
            value={message}
            onChange={(e) => draft(e.target.value)}
            placeholder="What are you working on, or hoping to change?"
          />
          <div className="actions">
            <label className="mode">
              Depth{" "}
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="conversation">Conversation</option>
                <option value="analysis">Explore alternatives</option>
              </select>
            </label>
            <button
              className="button primary"
              disabled={busy || !message.trim()}
            >
              Send <ArrowRight size={17} />
            </button>
          </div>
        </form>
        <p className="fine-print">
          Review extracted details before confirming. Local preview uses limited
          language rules; AI assistance is available only through the authorized
          founder configuration.
        </p>
      </div>
    </div>
  );
}
