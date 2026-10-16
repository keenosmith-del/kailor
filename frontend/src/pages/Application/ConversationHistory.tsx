import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api, sessionHref } from "../../services/api";
import { errorMessage } from "../../utils/errorMessage";
export function ConversationHistory({
  projectId,
  activeSessionId,
  busy,
  onNavigate,
}: {
  projectId: string;
  activeSessionId?: string;
  busy: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<{ id: string; updatedAt: string }[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function load(cursor?: string) {
    const result = await api<{
      sessions: typeof rows;
      nextCursor: string | null;
    }>(`/plans/${projectId}/sessions${cursor ? `?cursor=${cursor}` : ""}`);
    setRows((old) => (cursor ? [...old, ...result.sessions] : result.sessions));
    setCursor(result.nextCursor);
  }
  useEffect(() => {
    setRows([]);
    setError("");
    let current = true;
    void api<{ sessions: typeof rows; nextCursor: string | null }>(
      `/plans/${projectId}/sessions`,
    )
      .then((result) => {
        if (current) {
          setRows(result.sessions);
          setCursor(result.nextCursor);
        }
      })
      .catch((e) => {
        if (current) setError(errorMessage(e));
      });
    return () => {
      current = false;
    };
  }, [projectId, activeSessionId]);
  async function select(id: string) {
    try {
      const data = await api<{ selection: { revision: number } }>("/plans");
      await api(`/plans/${projectId}/select`, "POST", {
        revision: data.selection.revision,
        sessionId: id,
      });
      navigate(sessionHref(id, "chat"));
      onNavigate?.();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="conversation-toolbar">
      <nav aria-label="Project conversations" className="sidebar-conversations">
        {rows.map((r) => (
          <button
            key={r.id}
            disabled={busy}
            aria-label={`${r.id === activeSessionId ? "Active conversation" : "Conversation"} · ${new Date(r.updatedAt).toLocaleString()}`}
            aria-current={r.id === activeSessionId ? "true" : undefined}
            onClick={() => void select(r.id)}
          >
            <span className="conversation-title">
              {r.id === activeSessionId
                ? "Active conversation"
                : "Conversation"}
            </span>
            <small>
              <time
                dateTime={r.updatedAt}
                title={new Date(r.updatedAt).toLocaleString()}
              >
                {new Date(r.updatedAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </time>
            </small>
          </button>
        ))}
      </nav>
      {cursor && (
        <button
          className="text-link"
          onClick={() =>
            void load(cursor).catch((e) => setError(errorMessage(e)))
          }
        >
          Older conversations
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
