import { ArrowRight,MessageCircle } from "lucide-react";
import { useState,type FormEvent } from "react";
import { api } from "./api";
import type { SessionProps } from "./types";
export function Conversation({ session, busy, act }: SessionProps) {
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
    <div className="conversation">
      <div className="conversation-heading">
        <p className="eyebrow">room to think out loud</p>
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
              {[
                "What would be a sensible first step?",
                "set goals: Make it easier for people to find my work",
              ].map((p) => (
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
      {session.evidence
        .filter((e) => e.status === "inferred")
        .map((e) => (
          <div className="proposal" key={e.id}>
            <span className="badge">unconfirmed proposal</span>
            <p>
              <strong>{e.key}:</strong>{" "}
              {Array.isArray(e.value) ? e.value.join(", ") : e.value}
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
                Confirm
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
          <button className="button primary" disabled={busy || !message.trim()}>
            Send <ArrowRight size={17} />
          </button>
        </div>
      </form>
      <p className="fine-print">
        AI suggestions require confirmation. Development mode uses explicit “set
        field: value” proposals; it does not interpret arbitrary prose.
      </p>
    </div>
  );
}
