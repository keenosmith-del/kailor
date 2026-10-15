import "./Conversation.css";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowUp } from "lucide-react";
import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
} from "react";
import { mascotAssets } from "../../components/Mascot/mascot-assets";
import { Link } from "react-router";
import { conversationSuggestions } from "../../../../shared/src/conversation";
import { api, sessionHref } from "../../services/api";
import type { SessionProps, Next } from "../../types/session";
import { clearDrafts, readDraft, saveDraft } from "../../utils/drafts";
export function Conversation({
  session,
  busy,
  act,
  next,
  assess,
  ready,
  initialMessage = "",
  onInitialMessageConsumed,
}: SessionProps & {
  next: Next;
  assess: () => Promise<void>;
  ready: boolean;
  initialMessage?: string;
  onInitialMessageConsumed?: () => void;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reportId = params.get("report");
  const component = params.get("component");
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
    value: import("../../../../shared/src/index").AnswerValue,
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
  const shouldAnchor = useRef(visibleMessages.length > 0);
  const pendingFrom = useRef(visibleMessages.length);
  const [pendingMessage, setPendingMessage] = useState("");
  const [anchorSpace, setAnchorSpace] = useState(0);
  const tail = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);
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
  useLayoutEffect(() => {
    const element = history.current;
    if (!element || !shouldAnchor.current) return;
    const user = Array.from(
      element.querySelectorAll<HTMLElement>(".message.user"),
    ).at(-1);
    if (!user || !tail.current) return;
    const turnHeight =
      tail.current.getBoundingClientRect().bottom -
      user.getBoundingClientRect().top;
    setAnchorSpace(Math.max(0, element.clientHeight - turnHeight - 24));
    const frame = requestAnimationFrame(() => {
      if (shouldAnchor.current)
        element.scrollTop +=
          user.getBoundingClientRect().top -
          element.getBoundingClientRect().top -
          12;
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingMessage, session.messages.length]);
  useEffect(() => {
    if (initialMessage && !initialSent.current) {
      initialSent.current = true;
      onInitialMessageConsumed?.();
      void sendText(initialMessage);
    }
  }, [initialMessage]);
  useEffect(() => {
    setMessage(
      component
        ? `Help me understand ${component}. What should I verify before choosing it?`
        : reportId
          ? "Explain the recommendations in this saved assessment in plain language."
          : String(
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
    await sendText(message);
  }
  async function sendText(text: string) {
    if (!text.trim() || busy || sending.current) return;
    sending.current = true;
    shouldAnchor.current = true;
    pendingFrom.current = visibleMessages.length;
    setPendingMessage(text.trim());
    draft("");
    let completed = false;
    try {
      completed = await act(async () => {
        const requestStarted = performance.now();
        const response = await api<{
          provider: string;
          fallbackReason: string | null;
        }>(`/sessions/${session.id}/chat`, "POST", {
          revision: session.revision,
          message: text,
          mode: "conversation",
          ...(reportId ? { reportId } : {}),
        });
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.max(0, 700 - (performance.now() - requestStarted)),
          ),
        );
        setNotice(
          response.provider === "mock-development" &&
            response.fallbackReason !== "application_action"
            ? response.fallbackReason === "provider_timeout"
              ? "The model took too long. This reply uses local guidance; you can try your question again."
              : response.fallbackReason === "budget_exhausted_or_simulation"
                ? "Model assistance has reached its usage limit. Local guidance is available while you continue."
                : "This reply uses local guidance. You can continue here; model assistance depends on configuration, privacy checks and usage limits."
            : "",
        );
        draft("");
      });
    } finally {
      sending.current = false;
      setPendingMessage("");
      if (!completed) draft(text);
      input.current?.focus({ preventScroll: true });
    }
  }
  return (
    <div className="conversation-layout">
      <div className="conversation">
        <div className="conversation-heading">
          <h1>Chat</h1>
          {reportId && (
            <span className="badge">Discussing a saved assessment</span>
          )}
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              visibleMessages.length
                ? setClearing(true)
                : setNotice("There’s no conversation to clear.")
            }
          >
            Clear conversation
          </button>
        </div>
        <div
          className="chat-history"
          aria-live="polite"
          ref={history}
          onWheel={() => {
            shouldAnchor.current = false;
          }}
          onTouchStart={() => {
            shouldAnchor.current = false;
          }}
          onKeyDown={(e) => {
            if (
              [
                "PageUp",
                "PageDown",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
              ].includes(e.key)
            )
              shouldAnchor.current = false;
          }}
          onPointerDown={() => {
            shouldAnchor.current = false;
          }}
        >
          {!visibleMessages.length && !pendingMessage && (
            <div className="empty-chat">
              <img src={mascotAssets.head} alt="" width="76" height="76" />
              <h2>What would you like to explore?</h2>
              <p>
                Start with an idea, a challenge, or a question. We can work
                through it together.
              </p>
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
              {m.role !== "user" &&
                session.evidence.some(
                  (e) =>
                    e.active &&
                    e.status === "inferred" &&
                    (e.provenance?.sourceMessageId ===
                      visibleMessages[index - 1]?.id ||
                      (!e.provenance?.sourceMessageId &&
                        index === visibleMessages.length - 1)),
                ) && (
                  <details
                    className="inline-confirmations"
                    open={session.evidence.some(
                      (e) =>
                        e.active &&
                        e.status === "inferred" &&
                        e.provenance?.conflicts?.length &&
                        e.provenance.sourceMessageId ===
                          visibleMessages[index - 1]?.id,
                    )}
                  >
                    <summary>Review suggested project details</summary>
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
                                next.active.find((q) => q.id === e.key)
                                  ?.title ??
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
                  </details>
                )}
            </article>
          ))}
          {pendingMessage &&
            !visibleMessages
              .slice(pendingFrom.current)
              .some(
                (m, i) => m.role === "user" && m.content === pendingMessage,
              ) && (
              <article className="message user">
                <small>You</small>
                <p>{pendingMessage}</p>
              </article>
            )}
          {pendingMessage && (
            <article className="message assistant thinking" role="status">
              <img
                className="message-avatar"
                src={mascotAssets.head}
                alt=""
                width="32"
                height="32"
              />
              <small>kailor</small>
              <p>
                Thinking
                <span className="thinking-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="sr-only">…</span>
              </p>
            </article>
          )}
          {session.planProposals?.map((proposal) => (
            <section className="plan-proposal" key={proposal.id}>
              <p>
                Start a separate project for <strong>{proposal.title}</strong>?
              </p>
              <p className="muted">{proposal.description}</p>
              <div className="actions">
                {(
                  [
                    ["create", "Create separate project"],
                    ["continue_current", "Keep discussing this project"],
                    ["cancel", "Cancel"],
                  ] as const
                ).map(([decision, label]) => (
                  <button
                    key={decision}
                    className="button"
                    disabled={
                      busy ||
                      (decision === "create" &&
                        window.location.pathname.startsWith("/preview/"))
                    }
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
          {!!visibleMessages.length &&
            !pendingMessage &&
            !!next.suggestedPrompts.length && (
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
          <div ref={tail} />
          <div
            style={{ height: anchorSpace, flexShrink: 0 }}
            aria-hidden="true"
          />
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
              className="button primary chat-send"
              disabled={busy || !message.trim()}
            >
              <span className="sr-only">Send message</span>
              <ArrowUp size={19} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
