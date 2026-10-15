import { useNavigate } from "react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { mascotAssets } from "./mascot-assets";
import { Link } from "react-router";
import { conversationSuggestions } from "../../shared/src/conversation";
import { api, sessionHref } from "./api";
import type { SessionProps, Next } from "./types";
import { clearDrafts, readDraft, saveDraft } from "./drafts";
export function Conversation({
  session,
  busy,
  act,
  next,
  assess,
  ready,
}: SessionProps & { next: Next; assess: () => Promise<void>; ready: boolean }) {
  const navigate = useNavigate();
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
  const [message, setMessage] = useState("");
  const [clearing, setClearing] = useState(false);
  const visibleMessages = session.messages.filter(
    (m) => !m.hiddenFromTranscript,
  );
  const sending = useRef(false);
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const followBottom = useRef(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const providerNotice =
    notice ||
    (visibleMessages.filter((m) => m.role === "assistant").at(-1)?.provider ===
    "mock-development"
      ? "Local guidance for this reply."
      : "");
  const suggestions = session.planProposals?.length
    ? []
    : conversationSuggestions(next, visibleMessages);
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
  useEffect(() => {
    if (input.current) {
      input.current.style.height = "auto";
      input.current.style.height = `${Math.min(input.current.scrollHeight, 144)}px`;
    }
  }, [message]);
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
          mode: "conversation",
        });
        setNotice(
          response.provider === "mock-development" &&
            response.fallbackReason !== "application_action"
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
        <img
          src="/mascot/other/kailor-sitting.png"
          alt="kailor sitting beside the conversation"
          width="1024"
          height="1024"
        />
      </aside>
      <div className="conversation">
        <div className="conversation-heading">
          <h1>Conversation</h1>
          <button
            className="text-link"
            disabled={busy}
            onClick={() => setClearing(true)}
          >
            Clear conversation
          </button>
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
          {!visibleMessages.length && (
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
          {visibleMessages.map((m, index) => (
            <article className={`message ${m.role}`} key={m.id}>
              {m.role !== "user" && (
                <img
                  className="message-avatar"
                  src={mascotAssets.head}
                  alt=""
                  width="32"
                  height="32"
                />
              )}
              <small>{m.role === "user" ? "You" : "kailor"}</small>
              <p>{m.content}</p>
              {m.role !== "user" && (
                <div className="inline-confirmations">
                  {" "}
                  {session.evidence
                    .filter(
                      (e) =>
                        e.active &&
                        e.status === "inferred" &&
                        (e.provenance?.sourceMessageId ===
                          visibleMessages[index - 1]?.id ||
                          (!e.provenance?.sourceMessageId &&
                            index === visibleMessages.length - 1)),
                    )
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
                                api(
                                  `/sessions/${session.id}/evidence/${e.id}`,
                                  "POST",
                                  {
                                    revision: session.revision,
                                    accept: true,
                                    ...(editing[e.id] !== undefined
                                      ? { value: editing[e.id] }
                                      : {}),
                                  },
                                ),
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
                                api(
                                  `/sessions/${session.id}/evidence/${e.id}`,
                                  "POST",
                                  {
                                    revision: session.revision,
                                    accept: false,
                                  },
                                ),
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
                </div>
              )}
            </article>
          ))}
          {busy && (
            <p className="muted" role="status">
              Saving and processing your request…
            </p>
          )}
          {session.planProposals?.map((proposal) => (
            <section className="plan-proposal" key={proposal.id}>
              <p>
                Start a separate plan for <strong>{proposal.title}</strong>?
              </p>
              <p className="muted">{proposal.description}</p>
              <div className="actions">
                {(
                  [
                    ["create", "Create separate plan"],
                    ["continue_current", "Keep discussing current plan"],
                    ["cancel", "Cancel"],
                  ] as const
                ).map(([decision, label]) => (
                  <button
                    key={decision}
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      void act(async () => {
                        const result = await api<{
                          plan: { lastSessionId: string } | null;
                        }>(
                          `/sessions/${session.id}/plan-proposals/${proposal.id}`,
                          "POST",
                          { revision: session.revision, decision },
                        );
                        if (result.plan?.lastSessionId)
                          navigate(
                            sessionHref(
                              result.plan.lastSessionId,
                              "conversation",
                            ),
                          );
                      })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!!visibleMessages.length && !!next.suggestedPrompts.length && (
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
          {providerNotice && (
            <p className="fine-print" role="status">
              {providerNotice}
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
                  <Link
                    className="button"
                    to={sessionHref(session.id, "report")}
                  >
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
        </div>
        {clearing && (
          <div
            className="clear-confirmation"
            role="region"
            aria-label="Clear conversation"
          >
            <p>
              Clear this transcript and its AI context? History stays archived.
              Confirmed facts and reports stay saved. Your active draft will be
              discarded.
            </p>
            <div className="actions">
              <button
                className="button"
                disabled={busy}
                onClick={() =>
                  void act(async () => {
                    await api(
                      `/sessions/${session.id}/conversation/clear`,
                      "POST",
                      { revision: session.revision },
                    );
                    clearDrafts(session.id);
                    setMessage("");
                    setNotice("");
                    setClearing(false);
                  })
                }
              >
                Clear conversation
              </button>
              <button
                autoFocus
                className="text-link"
                onClick={() => setClearing(false)}
              >
                Cancel
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
            rows={1}
            value={message}
            onChange={(e) => draft(e.target.value)}
            placeholder="Message kailor…"
          />
          <div className="actions">
            <button
              className="button primary"
              disabled={busy || !message.trim()}
            >
              Send <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
