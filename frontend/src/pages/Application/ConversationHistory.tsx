import { useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
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
  const [renaming, setRenaming] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<
    { id: string; updatedAt: string; title?: string; revision?: number }[]
  >([]);
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
  async function rename(id: string) {
    setSaving(true);
    setError("");
    try {
      const current = await api<{ revision: number }>(`/sessions/${id}`);
      const updated = await api<{ id: string; title: string }>(
        `/plans/${projectId}/sessions/${id}`,
        "PATCH",
        { revision: current.revision, title: title.trim() },
      );
      setRows((old) =>
        old.map((row) =>
          row.id === id ? { ...row, title: updated.title } : row,
        ),
      );
      setRenaming(null);
      window.dispatchEvent(
        new CustomEvent("kailor:session-changed", { detail: id }),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
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
          <div className="conversation-row" key={r.id}>
            {renaming === r.id ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void rename(r.id);
                }}
              >
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={100}
                  aria-label="Conversation title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <button aria-label="Save conversation title" disabled={saving}>
                  <Check size={12} />
                </button>
                <button
                  type="button"
                  aria-label="Cancel conversation rename"
                  onClick={() => setRenaming(null)}
                >
                  <X size={12} />
                </button>
              </form>
            ) : (
              <>
                <button
                  className="conversation-select"
                  disabled={busy}
                  aria-label={`${r.id === activeSessionId ? "Active conversation" : "Conversation"}${r.title ? `: ${r.title}` : ""} · ${new Date(r.updatedAt).toLocaleString()}`}
                  aria-current={r.id === activeSessionId ? "true" : undefined}
                  onClick={() => void select(r.id)}
                >
                  <span className="conversation-title" title={r.title}>
                    {r.title ??
                      (r.id === activeSessionId
                        ? "Active conversation"
                        : "Conversation")}
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
                <button
                  className="conversation-rename"
                  aria-label={`Rename conversation ${r.title ?? new Date(r.updatedAt).toLocaleString()}`}
                  onClick={() => {
                    setRenaming(r.id);
                    setTitle(r.title ?? "Conversation");
                  }}
                >
                  <Pencil size={11} strokeWidth={1.4} />
                </button>
              </>
            )}
          </div>
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
