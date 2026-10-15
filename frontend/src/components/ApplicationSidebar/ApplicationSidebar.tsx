import { ConversationHistory } from "../../pages/Application/ConversationHistory";
import type { Session } from "../../../../shared/src/index";
import "./ApplicationSidebar.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
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
} from "lucide-react";
import type { PlanItem } from "../../../../shared/src/index";
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
  onNewConversation: () => Promise<void>;
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
};
export function ApplicationSidebar(props: Props) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState<PlanItem | null>(null);
  const [name, setName] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const displayName = props.guest
    ? "Guest"
    : props.account?.name || props.account?.email || "Your account";
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const background = document.querySelector<HTMLElement>(".application-body");
    const priorInert = background?.inert ?? false;
    if (background) background.inert = true;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() =>
      drawer.current?.querySelector<HTMLButtonElement>("button")?.focus(),
    );
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        drawer.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input:not(:disabled)",
        ) ?? [],
      );
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
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      if (background) background.inert = priorInert;
      document.removeEventListener("keydown", key);
      trigger.current?.focus();
    };
  }, [open]);
  return (
    <>
      <header className="application-header">
        <div className="application-wordmark">
          <button
            ref={trigger}
            className="application-icon"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="application-sidebar"
            onClick={() => setOpen(true)}
          >
            <MoreHorizontal size={21} />
          </button>
          <Link to={props.href("chat")}>kailor</Link>
        </div>
        <span className="application-project-title">{props.title}</span>
      </header>
      <nav
        className="application-rail"
        aria-label="Quick navigation"
        inert={open}
      >
        {applicationPages.map(({ view, label, icon: Icon }) => (
          <Link
            key={view}
            className="rail-link"
            to={props.href(view)}
            aria-label={label}
            aria-current={props.view === view ? "page" : undefined}
          >
            <Icon size={19} strokeWidth={1.5} />
            <span role="tooltip">{label}</span>
          </Link>
        ))}
      </nav>
      <div
        className={`sidebar-overlay ${open ? "is-open" : ""}`}
        inert={!open}
        aria-hidden={!open}
      >
        <button
          className="sidebar-backdrop"
          tabIndex={-1}
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
        <aside
          id="application-sidebar"
          ref={drawer}
          className="application-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation and projects"
          onTransitionEnd={(event) => {
            if (
              open &&
              event.target === event.currentTarget &&
              !event.currentTarget.contains(document.activeElement)
            )
              event.currentTarget
                .querySelector<HTMLButtonElement>("button")
                ?.focus();
          }}
        >
          <div className="sidebar-heading">
            <span>kailor</span>
            <button
              className="application-icon"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <X size={19} />
            </button>
          </div>
          <nav aria-label="Application pages">
            {applicationPages.map(({ view, label, icon: Icon }) => (
              <Link
                key={view}
                to={props.href(view)}
                aria-current={props.view === view ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} strokeWidth={1.5} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-projects">
            <div className="sidebar-project-heading">
              <span>Projects</span>
              {!props.guest && (
                <button
                  className="application-icon"
                  aria-label="New project"
                  onClick={() => {
                    setOpen(false);
                    props.onNew();
                  }}
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
            {props.guest && (
              <p className="sidebar-hint">
                One temporary project. Your work stays here when you switch
                pages.
              </p>
            )}
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
                      <Check size={17} />
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
                  <>
                    <button
                      className="sidebar-project-select"
                      aria-current={
                        project.id === props.activeId ? "true" : undefined
                      }
                      disabled={props.busy}
                      onClick={() => {
                        props.onSelect(project);
                        setOpen(false);
                      }}
                    >
                      {project.id === props.activeId && (
                        <span className="project-dot" />
                      )}
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
                      <Pencil size={14} />
                    </button>
                  </>
                )}
                {project.id === props.activeId && props.session && (
                  <ConversationHistory
                    session={props.session}
                    busy={props.busy}
                    onNew={props.onNewConversation}
                    onNavigate={() => setOpen(false)}
                  />
                )}
              </div>
            ))}
            {props.more && (
              <button
                className="text-link"
                disabled={props.busy}
                onClick={props.onMore}
              >
                More projects
              </button>
            )}
            {!props.projects.length && (
              <p className="sidebar-hint">
                Start with an idea, a challenge, or a question.
              </p>
            )}
          </div>
          <div className="sidebar-profile">
            <div className="profile-identity">
              <span className="profile-avatar" aria-hidden="true">
                {displayName[0].toUpperCase()}
              </span>
              <span>{displayName}</span>
            </div>
            <Link to={props.href("settings")} onClick={() => setOpen(false)}>
              <Settings size={17} />
              Settings
            </Link>
            <Link to={props.href("account")} onClick={() => setOpen(false)}>
              <User size={17} />
              Account
            </Link>
            {props.guest ? (
              <div className="guest-account-links">
                <Link to="/sign-in">Sign in</Link>
                <Link to="/create-account">Create account</Link>
              </div>
            ) : (
              <button onClick={props.onLogout}>
                <LogOut size={17} />
                Sign out
              </button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
