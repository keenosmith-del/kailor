import "./Conversation.css";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowUp, Plus } from "lucide-react";
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
import { api, sessionHref, uploadSource } from "../../services/api";
import type { Report, ConsultingBrief } from "../../../../shared/src/index";
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
  const directionId = params.get("direction");
  const nodeId = params.get("node");
  const [liveNode, setLiveNode] = useState<{
    purpose: string;
    decision?: string;
    status: string;
  } | null>(null);
  const [liveBrief, setLiveBrief] = useState<ConsultingBrief | null>(null);
  useEffect(() => {
    let current = true;
    setLiveBrief(null);
    setLiveNode(null);
    if (!reportId && (session.answers.length > 1 || component))
      void api<{
        consulting?: ConsultingBrief;
        graph?: {
          nodes: {
            id: string;
            purpose: string;
            decision?: string;
            status: string;
          }[];
        };
      }>(`/sessions/${session.id}/canvas`)
        .then((result) => {
          if (current) {
            setLiveBrief(result.consulting ?? null);
            const node =
              result.graph?.nodes.find((n) => n.id === nodeId) ?? null;
            setLiveNode(node);
            if (component && node)
              setMessage((old) =>
                old ===
                `Help me understand ${component}. What should I verify before choosing it?`
                  ? node.decision === "selected" ||
                    node.decision === "developing"
                    ? `I've selected this direction for exploration: ${component}. Help me develop a practical plan while respecting my first-phase requirements and the capabilities I've postponed.`
                    : node.decision === "deferred" ||
                        node.decision === "rejected"
                      ? `Discuss ${component}, currently ${node.decision}. Help me review the reasons and trade-offs without treating it as active scope.`
                      : `Help me examine ${component}: ${node.purpose}. What should I verify next?`
                  : old,
              );
          }
        })
        .catch(() => {});
    return () => {
      current = false;
    };
  }, [reportId, session.id, session.knowledgeRevision, nodeId, component]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  useEffect(() => {
    let current = true;
    setSelectedReport(null);
    if (reportId && session.planId)
      void api<{ content: Report }>(
        `/plans/${session.planId}/reports/${reportId}`,
      )
        .then((result) => {
          if (current) setSelectedReport(result.content);
        })
        .catch(() => {});
    return () => {
      current = false;
    };
  }, [reportId, session.planId]);
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
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [attachmentNotice, setAttachmentNotice] = useState("");
  const [clearing, setClearing] = useState(false);
  const visibleMessages = session.messages.filter(
    (m) => !m.hiddenFromTranscript,
  );
  const sending = useRef(false);
  const [notice, setNotice] = useState("");
  const [emptyClearNotice, setEmptyClearNotice] = useState(0);
  useEffect(() => {
    if (!emptyClearNotice) return;
    const timer = window.setTimeout(() => setEmptyClearNotice(0), 3000);
    return () => window.clearTimeout(timer);
  }, [emptyClearNotice]);
  const input = useRef<HTMLInputElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const shouldAnchor = useRef(visibleMessages.length > 0);
  const pendingFrom = useRef(visibleMessages.length);
  const [pendingMessage, setPendingMessage] = useState("");
  const [anchorSpace, setAnchorSpace] = useState(0);
  const tail = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const providerNotice =
    (emptyClearNotice ? "There’s no conversation to clear." : "") ||
    notice ||
    (visibleMessages.filter((m) => m.role === "assistant").at(-1)?.provider ===
    "mock-development"
      ? "Local guidance for this reply."
      : "");
  const contextualPrompts = (
    selectedReport?.consulting ?? liveBrief
  )?.directions
    .filter((d) => !["rejected", "deferred"].includes(d.status))
    .slice(0, 2)
    .map((d) => ({
      label: ["selected", "developing"].includes(d.status)
        ? "Develop the selected direction"
        : `Examine ${d.title.toLowerCase()}`,
      message: `Help me ${["selected", "developing"].includes(d.status) ? "develop the selected direction" : "examine the proposed direction"}: ${d.title} ${reportId ? "from this saved assessment" : "using my current Discovery context"}. Explain its fit, constraints and first practical test.`,
    }));
  const suggestions = contextualPrompts?.length
    ? contextualPrompts
    : component
      ? [
          {
            label: "Examine this step",
            message: `Help me examine ${component}: its evidence, uncertainties and smallest next step.`,
          },
        ]
      : session.planProposals?.length
        ? []
        : !session.answers.length && !visibleMessages.length
          ? [
              {
                label: "Talk through an idea",
                message: "I would like to talk through an idea.",
              },
              {
                label: "Find a starting point",
                message:
                  "I am not sure where to begin. Help me explore without assuming I have a business idea.",
              },
            ]
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
    setEmptyClearNotice(0);
    setMessage(
      component
        ? `Help me understand ${component}. What should I verify before choosing it?`
        : reportId
          ? directionId
            ? `Explain the ${directionId.replaceAll("-", " ")} direction in this saved assessment using my circumstances, constraints and a first practical test.`
            : "Explain the recommendations in this saved assessment in plain language."
          : String(
              readDraft(
                session.id,
                session.knowledgeRevision ?? session.revision,
                "conversation",
              ) ?? "",
            ),
    );
  }, [session.id, reportId, component, directionId]);
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
    if (text.length > 4000) {
      setAttachmentNotice(
        "This message exceeds 4,000 characters. Your text is kept here; shorten it before sending.",
      );
      return;
    }
    sending.current = true;
    setEmptyClearNotice(0);
    setAttachmentNotice("");
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
            <Link
              className="badge"
              to={`${sessionHref(session.id, "analysis")}?report=${reportId}`}
            >
              Discussing: {selectedReport?.title ?? "a saved assessment"} · View
              assessment
            </Link>
          )}
          {!reportId && component && (
            <span className="badge">
              Discussing: {component}
              {liveNode ? ` · ${liveNode.decision ?? liveNode.status}` : ""}
            </span>
          )}
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              visibleMessages.length
                ? setClearing(true)
                : setEmptyClearNotice((count) => count + 1)
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
              <h2>
                {reportId
                  ? "Let's explore your assessment."
                  : component
                    ? `Let's look at ${component}.`
                    : session.answers.length
                      ? "Let's build on what you've shared."
                      : "Coffee chat"}
              </h2>
              <p>
                {reportId
                  ? (selectedReport?.consulting?.summary ??
                    "We can compare the assessment's directions, examine what supports them and choose a small next step.")
                  : component
                    ? "We can examine this step, its assumptions and what you want to do next."
                    : session.answers.length
                      ? "Your Discovery information is here. We can compare possibilities or work through an open decision."
                      : "Hey, welcome. We can start wherever you like — an idea you're considering, something you're struggling with, or absolutely nothing figured out yet. What's on your mind?"}
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
          {pendingMessage &&
            !visibleMessages
              .slice(pendingFrom.current)
              .some((m) => m.role === "assistant") && (
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
        {(providerNotice || attachmentNotice || message.length > 4000) && (
          <div className="composer-notice" role="status">
            {message.length > 4000
              ? "This message exceeds 4,000 characters. Your text is kept here; shorten it before sending."
              : emptyClearNotice
                ? "There’s no conversation to clear."
                : attachmentNotice || providerNotice}
          </div>
        )}
        <form className="chat-form" onSubmit={send}>
          <input
            ref={fileInput}
            hidden
            type="file"
            tabIndex={-1}
            aria-label="Project documents"
            accept=".txt,.csv,text/plain,text/csv"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (!files.length || uploading) return;
              const planId = session.planId;
              if (!planId) {
                setAttachmentNotice("Open a project before adding documents.");
                return;
              }
              setUploading(true);
              setAttachmentNotice("Adding documents…");
              void (async () => {
                const added: string[] = [];
                try {
                  for (const file of files) {
                    await uploadSource(planId, file);
                    added.push(file.name);
                  }
                  setAttachmentNotice(
                    `Added ${added.join(", ")} to this project's Sources.`,
                  );
                } catch (error) {
                  setAttachmentNotice(
                    `${added.length ? `Added ${added.join(", ")}. ` : ""}${error instanceof Error ? error.message : "Could not add this document."} Use UTF-8 text or CSV, up to 64 KB each.`,
                  );
                } finally {
                  setUploading(false);
                }
              })();
            }}
          />
          <button
            type="button"
            className="chat-attach"
            aria-label="Add documents"
            title="Add text or CSV documents (up to 64 KB each)"
            disabled={busy || uploading || !!session.plan?.archivedAt}
            onClick={() => fileInput.current?.click()}
          >
            <Plus size={17} strokeWidth={1.5} />
          </button>
          <label className="sr-only" htmlFor="message">
            Your message
          </label>
          <input
            type="text"
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
            value={message}
            onChange={(e) => draft(e.target.value)}
            placeholder="Message kailor…"
          />
          <div className="actions">
            <button
              className="button chat-send"
              disabled={
                busy || uploading || !message.trim() || message.length > 4000
              }
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
