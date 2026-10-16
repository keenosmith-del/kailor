import { ConversationHistory } from "../../pages/Application/ConversationHistory";
import type { Session, PlanItem } from "../../../../shared/src/index";
import "./ApplicationSidebar.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  MessageCircle,
  Compass,
  Layers,
  FileText,
  FolderOpen,
  MoreHorizontal,
  X,
  Plus,
  Pencil,
  Settings,
  User,
  LogOut,
  Check,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import type { Account } from "../../types/account";

export const applicationPages = [
  { view: "chat", label: "Chat", icon: MessageCircle },
  { view: "discovery", label: "Discovery", icon: Compass },
  { view: "canvas", label: "Solution canvas", icon: Layers },
  { view: "analysis", label: "Analysis", icon: FileText },
  { view: "sources", label: "Sources", icon: FolderOpen },
];
type Props = {
  session: Session | null;
  onNewConversation: (projectId?: string) => Promise<void>;
  account: Account | null;
  guest: boolean;
  view: string;
  title: string;
  projects: PlanItem[];
  activeId?: string;
  busy: boolean;
  more: boolean;
  href: (view: string) => string;
  onSelect: (project: PlanItem) => void;
  onRename: (project: PlanItem, title: string) => Promise<unknown>;
  onNew: () => void;
  onMore: () => void;
  onLogout: () => void;
  onExitGuest: () => void;
};
export function ApplicationSidebar(props: Props) {
  const navigate = useNavigate();
  const [conversationPending, setConversationPending] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [renaming, setRenaming] = useState<PlanItem | null>(null);
  const [name, setName] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const displayName = props.guest
    ? "Guest"
    : props.account?.name || props.account?.email || "Your account";
  const close = () => {
    setOpen(false);
    setProfile(false);
    setRenaming(null);
  };
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const backgrounds = [
      ".application-body",
      ".application-header",
      ".app-shell > footer",
    ].map((selector) => document.querySelector<HTMLElement>(selector));
    const prior = backgrounds.map((element) => element?.inert ?? false);
    backgrounds.forEach((element) => {
      if (element) element.inert = true;
    });
    document.body.style.overflow = "hidden";
    trigger.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        drawer.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input:not(:disabled)",
        ) ?? [],
      ).filter((node) => node.getClientRects().length > 0);
      const first = nodes[0],
        last = nodes.at(-1);
      if (!drawer.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previousOverflow;
      backgrounds.forEach((element, index) => {
        if (element) element.inert = prior[index];
      });
      document.removeEventListener("keydown", key);
      trigger.current?.focus();
    };
  }, [open]);
  return (
    <>
      <header className="application-header">
        <span className="application-project-title">{props.title}</span>
      </header>
      {open && (
        <button
          className="sidebar-backdrop"
          tabIndex={-1}
          aria-label="Dismiss navigation backdrop"
          onClick={close}
        />
      )}
      <aside
        ref={drawer}
        id="application-sidebar"
        className={`application-navigation ${open ? "is-open" : ""}`}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Navigation and projects"
      >
        <div className="navigation-heading">
          <button
            ref={trigger}
            className="application-icon"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="application-sidebar"
            onClick={() => (open ? close() : setOpen(true))}
          >
            <MoreHorizontal size={20} />
          </button>
          <Link
            className="navigation-brand"
            to={props.href("chat")}
            onClick={close}
          >
            kailor
          </Link>
        </div>
        <div className="navigation-content">
          <nav className="navigation-pages" aria-label="Application pages">
            {applicationPages.map(({ view, label, icon: Icon }) => (
              <Link
                key={view}
                to={props.href(view)}
                aria-label={label}
                aria-current={props.view === view ? "page" : undefined}
                onClick={close}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span className="navigation-label" aria-hidden="true">
                  {label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-projects" hidden={!open}>
            <div className="sidebar-project-heading">
              <span>Projects</span>
              <button
                className="application-icon"
                aria-label="New project"
                title="New project"
                onClick={() => {
                  close();
                  if (props.guest) navigate("/preview/discovery");
                  else props.onNew();
                }}
              >
                <Plus size={15} />
              </button>
            </div>
            {props.projects.map((project) => (
              <div className="sidebar-project" key={project.id}>
                {renaming?.id === project.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void props
                        .onRename(project, name.trim())
                        .then(() => setRenaming(null));
                    }}
                  >
                    <input
                      autoFocus
                      aria-label="Project name"
                      maxLength={150}
                      minLength={2}
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <button
                      className="application-icon"
                      disabled={props.busy || name.trim().length < 2}
                      aria-label="Save project name"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="application-icon"
                      aria-label="Cancel rename"
                      onClick={() => setRenaming(null)}
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <div className="sidebar-project-row">
                    <button
                      className="application-icon project-expand"
                      aria-label={`${expanded.has(project.id) ? "Collapse" : "Expand"} conversations for ${project.title}`}
                      aria-expanded={expanded.has(project.id)}
                      aria-controls={`conversations-${project.id}`}
                      onClick={() =>
                        setExpanded((old) => {
                          const next = new Set(old);
                          if (next.has(project.id)) next.delete(project.id);
                          else next.add(project.id);
                          return next;
                        })
                      }
                    >
                      <ChevronRight size={14} strokeWidth={1.4} />
                    </button>
                    <button
                      className="sidebar-project-select"
                      title={project.title}
                      aria-label={`Open project ${project.title}`}
                      aria-current={
                        project.id === props.activeId ? "true" : undefined
                      }
                      disabled={props.busy}
                      onClick={() => {
                        props.onSelect(project);
                        close();
                      }}
                    >
                      <span>{project.title}</span>
                    </button>
                    <button
                      className="application-icon project-rename"
                      aria-label={`Rename ${project.title}`}
                      onClick={() => {
                        setRenaming(project);
                        setName(project.title);
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="application-icon project-new-conversation"
                      aria-label={`New conversation in ${project.title}`}
                      title="New conversation"
                      disabled={
                        props.busy ||
                        conversationPending ||
                        !!project.archivedAt
                      }
                      onClick={() => {
                        setConversationPending(true);
                        setConversationError("");
                        void props
                          .onNewConversation(project.id)
                          .then(close)
                          .catch((error) =>
                            setConversationError(
                              error instanceof Error
                                ? error.message
                                : "Could not start a conversation.",
                            ),
                          )
                          .finally(() => setConversationPending(false));
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
                <div
                  id={`conversations-${project.id}`}
                  hidden={!expanded.has(project.id)}
                >
                  {open && expanded.has(project.id) && (
                    <ConversationHistory
                      projectId={project.id}
                      activeSessionId={props.session?.id}
                      busy={props.busy}
                      onNavigate={close}
                    />
                  )}
                </div>
              </div>
            ))}
            {conversationError && (
              <p className="sidebar-hint" role="alert">
                {conversationError}
              </p>
            )}
            {props.more && (
              <button
                className="text-link"
                disabled={props.busy}
                onClick={props.onMore}
              >
                More projects
              </button>
            )}
            {props.guest && (
              <Link
                className="guest-journey-link"
                to="/preview/discovery"
                onClick={close}
              >
                Guest journeys
              </Link>
            )}
          </div>
        </div>
        <div className="sidebar-profile" hidden={!open}>
          <div
            id="profile-options"
            className="profile-options"
            hidden={!profile}
          >
            <Link to={props.href("settings")} onClick={close}>
              <Settings size={16} />
              Settings
            </Link>
            <Link to={props.href("account")} onClick={close}>
              <User size={16} />
              Account
            </Link>
            {props.guest ? (
              <button
                onClick={() => {
                  close();
                  props.onExitGuest();
                }}
              >
                <LogOut size={16} />
                Exit guest session
              </button>
            ) : (
              <button
                onClick={() => {
                  close();
                  props.onLogout();
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            )}
          </div>
          <button
            className="profile-identity"
            aria-label={`${displayName}, account options`}
            aria-expanded={profile}
            aria-controls="profile-options"
            onClick={() => setProfile((value) => !value)}
          >
            <span className="profile-avatar" aria-hidden="true">
              {displayName[0].toUpperCase()}
            </span>
            <span title={displayName}>{displayName}</span>
            <ChevronUp size={14} strokeWidth={1.4} />
          </button>
        </div>
      </aside>
    </>
  );
}
