import { ArrowRight, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Mascot } from "./Mascot";
import { api } from "./api";
import type { SessionProps, Next } from "./types";
export function Conversation({
  session,
  busy,
  act,
  next,
}: SessionProps & { next: Next }) {
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
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    await act(async () => {
      await api(`/sessions/${session.id}/chat`, "POST", {
        revision: session.revision,
        message,
        mode,
      });
      setMessage("");
    });
  }
  return (
    <div className="conversation-layout">
      <aside className="conversation-mascot">
        <Mascot state={busy ? "thinking" : "conversation"} variant="head" />
      </aside>
      <div className="conversation">
        <div className="conversation-heading">
          <h1>Let’s talk it through.</h1>
          <p className="muted">
            Your confirmed discovery answers are already part of this
            conversation.
          </p>
        </div>
        <div className="chat-history" aria-live="polite">
          {!session.messages.length && (
            <div className="empty-chat">
              <MessageCircle size={26} />
              <p>What’s on your mind?</p>
              <div className="suggestions">
                {next.suggestedPrompts.map((p) => (
                  <button key={p} onClick={() => setMessage(p)}>
                    {p}
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
                    ? "kailor · development mode"
                    : "kailor · AI assistance"}
              </small>
              <p>{m.content}</p>
            </article>
          ))}
          {busy && <p className="muted">Thinking through your context…</p>}
        </div>
        {session.evidence.filter((e) => e.status === "inferred").length > 1 && (
          <div className="actions">
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                void act(() =>
                  api(`/sessions/${session.id}/evidence`, "POST", {
                    revision: session.revision,
                    ids: session.evidence
                      .filter((e) => e.status === "inferred")
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
                      .filter((e) => e.status === "inferred")
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
          .filter((e) => e.status === "inferred")
          .map((e) => (
            <div className="proposal" key={e.id}>
              <span className="badge">
                {e.provenance?.conflicts?.length
                  ? "proposed correction"
                  : "unconfirmed proposal"}
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
                {displayValue(e.key, e.value)}
              </p>
              <p className="muted">
                Confirming replaces the answer for this field. Related questions
                may change.
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
              </div>
            </div>
          ))}
        <form className="chat-form" onSubmit={send}>
          <label className="sr-only" htmlFor="message">
            Your message
          </label>
          <textarea
            id="message"
            maxLength={4000}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us a little more…"
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
