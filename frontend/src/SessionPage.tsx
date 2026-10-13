import {
ArrowLeft,
FileText,
LayoutGrid,
MessageCircle,
Plus,
} from "lucide-react";
import { useCallback,useEffect,useState } from "react";
import { Link,Navigate,NavLink,useNavigate,useParams } from "react-router";
import type { Session } from "../../shared/src/index";
import { Analysis } from "./Analysis";
import { api } from "./api";
import { Canvas } from "./Canvas";
import { Conversation } from "./Conversation";
import { Discovery } from "./Discovery";
import type { Next } from "./types";
import { ErrorBox,errorMessage } from "./ui";
export function SessionPage() {
  const { id = "", view = "discovery" } = useParams();
  const [session, setSession] = useState<Session | null>(null),
    [next, setNext] = useState<Next | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const reload = useCallback(async () => {
    const [s, n] = await Promise.all([
      api<Session>(`/sessions/${id}`),
      api<Next>(`/sessions/${id}/next`),
    ]);
    setSession(s);
    setNext(n);
  }, [id]);
  useEffect(() => {
    setSession(null);
    setError("");
    void reload().catch((e) => setError(errorMessage(e)));
  }, [reload]);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(errorMessage(e));
      await reload().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  async function assess() {
    if (!session) return;
    await act(async () => {
      await api(`/sessions/${id}/assessment`, "POST", {
        revision: session.revision,
      });
      navigate(`/sessions/${id}/report`);
    });
  }
  return (
    <main className="session-shell">
      <div className="session-top">
        <Link className="text-link" to="/workspace">
          <ArrowLeft size={15} /> Workspace
        </Link>
        <span>
          {session?.subject.name}
          {session?.synthetic && <span className="badge">synthetic</span>}
        </span>
        <span className="saved">
          {busy ? "Saving…" : "Saved to your session"}
        </span>
      </div>
      <nav className="view-nav" aria-label="Discovery views">
        {[
          { id: "discovery", label: "Discovery", icon: <Plus size={16} /> },
          {
            id: "conversation",
            label: "Conversation",
            icon: <MessageCircle size={16} />,
          },
          {
            id: "canvas",
            label: "Solution canvas",
            icon: <LayoutGrid size={16} />,
          },
          { id: "report", label: "Analysis", icon: <FileText size={16} /> },
        ].map((v) => (
          <NavLink key={v.id} to={`/sessions/${id}/${v.id}`}>
            {v.icon}
            {v.label}
          </NavLink>
        ))}
      </nav>
      <ErrorBox error={error} />
      {!session || !next ? (
        <div className="loading">
          {error ? "Unable to load this session." : "Gathering your context…"}
        </div>
      ) : (
        <>
          {view === "discovery" ? (
            <Discovery
              session={session}
              next={next}
              busy={busy}
              act={act}
              assess={assess}
            />
          ) : view === "conversation" ? (
            <Conversation session={session} busy={busy} act={act} />
          ) : view === "canvas" ? (
            <Canvas session={session} assess={assess} busy={busy} />
          ) : view === "report" ? (
            <Analysis session={session} assess={assess} busy={busy} />
          ) : (
            <Navigate to={`/sessions/${id}/discovery`} replace />
          )}
        </>
      )}
    </main>
  );
}
