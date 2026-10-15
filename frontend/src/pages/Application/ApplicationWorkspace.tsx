import "./ApplicationWorkspace.css";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Plus, X } from "lucide-react";
import type { Session } from "../../../../shared/src/index";
import type { Account } from "../../types/account";
import { ApplicationSidebar } from "../../components/ApplicationSidebar/ApplicationSidebar";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { SessionPage } from "../SessionPage/SessionPage";
import { useProjects } from "./useProjects";
import { api, sessionHref } from "../../services/api";
import { clearDrafts } from "../../utils/drafts";
import { AccountPage, SettingsPage } from "./PersonalPages";
import { mascotAssets } from "../../components/Mascot/mascot-assets";

export function ApplicationWorkspace({ account }: { account: Account | null }) {
  const { id, view: routeView } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const guest = location.pathname.startsWith("/preview/");
  const resolvedView =
    ({ conversation: "chat", report: "analysis" } as Record<string, string>)[
      routeView ?? ""
    ] ??
    routeView ??
    "chat";
  const view = [
    "chat",
    "discovery",
    "canvas",
    "analysis",
    "sources",
    "settings",
    "account",
  ].includes(resolvedView)
    ? resolvedView
    : "chat";
  const projects = useProjects(
    guest,
    account?.email ?? "guest",
    !guest || !!id,
  );
  const [session, setSession] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const guestBoot = useRef(false);
  const [entryError, setEntryError] = useState("");
  const href = (destination: string) =>
    id
      ? sessionHref(id, destination)
      : `/${guest ? "preview" : "app"}/${destination}`;
  useEffect(() => {
    if (id || !guest || guestBoot.current) return;
    guestBoot.current = true;
    void api<Session>("/guest/sessions", "POST", {})
      .then((s) => navigate(`/preview/${s.id}/${view}`, { replace: true }))
      .catch((e) => setEntryError(e.message));
  }, [id, guest, view]);
  useEffect(() => {
    if (id || guest || !projects.data) return;
    const selected =
      projects.data.plans.find(
        (p) => p.id === projects.data?.selection.activePlanId,
      ) ??
      [...projects.data.plans].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      )[0];
    if (selected?.lastSessionId)
      navigate(sessionHref(selected.lastSessionId, view), { replace: true });
  }, [id, guest, projects.data, view]);
  useEffect(() => {
    if (!creating) return;
    const previous = document.activeElement as HTMLElement | null;
    const body = document.querySelector<HTMLElement>(".application-body");
    const header = document.querySelector<HTMLElement>(".application-header");
    const rail = document.querySelector<HTMLElement>(".application-rail");
    const overflow = document.body.style.overflow;
    for (const element of [body, header, rail])
      if (element) element.inert = true;
    document.body.style.overflow = "hidden";
    return () => {
      for (const element of [body, header, rail])
        if (element) element.inert = false;
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [creating]);
  const selectedRoute = useRef("");
  function loadedSession(value: Session) {
    setSession(value);
    if (
      selectedRoute.current === value.id ||
      !value.planId ||
      value.plan?.archivedAt
    )
      return;
    selectedRoute.current = value.id;
    void api<{ selection: { revision: number; activePlanId: string | null } }>(
      "/plans",
    )
      .then(async (latest) => {
        if (
          latest.selection.activePlanId !== value.planId ||
          projects.data?.plans.find((p) => p.id === value.planId)
            ?.lastSessionId !== value.id
        ) {
          await api(`/plans/${value.planId}/select`, "POST", {
            revision: latest.selection.revision,
            sessionId: value.id,
          });
          await projects.refresh();
        }
      })
      .catch((e) => setEntryError(e.message));
  }
  async function createProject(firstMessage = "") {
    const result = await projects.create(
      title.trim() ||
        (firstMessage.trim().length >= 2
          ? firstMessage.slice(0, 100)
          : "New project"),
    );
    if (result) {
      setCreating(false);
      setTitle("");
      setPrompt("");
      setInitialMessage(firstMessage);
      navigate(sessionHref(result, "chat"));
    }
  }
  const conversationKey = useRef(crypto.randomUUID());
  const newConversationPending = useRef(false);
  async function newConversation() {
    if (!session?.plan || projects.busy || newConversationPending.current)
      return;
    newConversationPending.current = true;
    try {
      const latest = await api<{ revision: number }>(
        `/plans/${session.planId}`,
      );
      const result = await api<{ sessionId: string }>(
        `/plans/${session.planId}/sessions`,
        "POST",
        {
          revision: latest.revision,
          creationKey: conversationKey.current,
          carryContext: true,
        },
      );
      conversationKey.current = crypto.randomUUID();
      navigate(sessionHref(result.sessionId, "chat"));
      void projects.refresh().catch((e) => setEntryError(e.message));
    } catch (error) {
      setEntryError(
        error instanceof Error
          ? error.message
          : "Could not start a conversation.",
      );
    } finally {
      newConversationPending.current = false;
    }
  }
  return (
    <main className={`application-workspace application-view-${view}`}>
      <ApplicationSidebar
        account={account}
        guest={guest}
        view={view}
        title={
          id
            ? (projects.data?.plans.find((p) => p.id === session?.planId)
                ?.title ??
              session?.plan?.title ??
              "Opening project…")
            : ""
        }
        projects={(projects.data?.plans ?? []).filter(
          (p) => !guest || p.id === session?.planId,
        )}
        activeId={session?.planId}
        busy={projects.busy}
        more={!guest && !!projects.data?.nextCursor}
        href={href}
        onSelect={(project) =>
          void projects.select(project).then((selected) => {
            if (selected) navigate(sessionHref(selected, view));
          })
        }
        onRename={projects.rename}
        onNew={() => setCreating(true)}
        onMore={() => void projects.more()}
        onLogout={() =>
          void api("/auth/logout", "POST").then(() => {
            clearDrafts();
            window.location.assign("/sign-in");
          })
        }
      />
      <div className="application-body">
        <ErrorBox error={projects.error || entryError} />
        {guest && !id ? (
          <p className="loading" role="status">
            Opening your project…
          </p>
        ) : view === "settings" ? (
          <SettingsPage key={guest ? "guest" : account?.email} guest={guest} />
        ) : view === "account" ? (
          <AccountPage account={account} guest={guest} />
        ) : id ? (
          <SessionPage
            sessionId={id}
            activeView={view}
            onSession={loadedSession}
            initialMessage={initialMessage}
            onInitialMessageConsumed={() => setInitialMessage("")}
            onNewConversation={newConversation}
            onProjectChange={() => void projects.refresh()}
          />
        ) : projects.data && !guest ? (
          <section className="project-start">
            <img src={mascotAssets.head} width="80" height="80" alt="" />
            <h1>What would you like to explore?</h1>
            <p>
              Start with an idea, a challenge, or a question. We can work
              through it together.
            </p>
            <form
              className="chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                void createProject(prompt.trim());
              }}
            >
              <label className="sr-only" htmlFor="first-message">
                Your message
              </label>
              <textarea
                id="first-message"
                rows={2}
                maxLength={4000}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Message kailor…"
                required
              />
              <button
                className="button primary"
                disabled={projects.busy || !prompt.trim()}
              >
                Send
              </button>
            </form>
            <button className="text-link" onClick={() => setCreating(true)}>
              <Plus size={15} />
              Name a project first
            </button>
          </section>
        ) : (
          <p className="loading" role="status">
            Opening your project…
          </p>
        )}
      </div>
      {creating && (
        <div
          className="project-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreating(false);
          }}
        >
          <section
            className="project-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setCreating(false);
              if (e.key === "Tab") {
                const nodes = Array.from(
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "button:not(:disabled),input",
                  ),
                );
                if (e.shiftKey && document.activeElement === nodes[0]) {
                  e.preventDefault();
                  nodes.at(-1)?.focus();
                } else if (
                  !e.shiftKey &&
                  document.activeElement === nodes.at(-1)
                ) {
                  e.preventDefault();
                  nodes[0]?.focus();
                }
              }
            }}
          >
            <button
              className="application-icon dialog-close"
              aria-label="Close new project"
              onClick={() => setCreating(false)}
            >
              <X size={18} />
            </button>
            <h2 id="new-project-title">A little room for your idea.</h2>
            <p>Give it a name. You can work out the details together.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void createProject();
              }}
            >
              <label htmlFor="project-title">Project name</label>
              <input
                id="project-title"
                autoFocus
                required
                minLength={2}
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                className="button primary"
                disabled={projects.busy || title.trim().length < 2}
              >
                Create project
              </button>
            </form>
            <ErrorBox error={projects.error} />
          </section>
        </div>
      )}
    </main>
  );
}
