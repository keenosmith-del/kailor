import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import type { Session } from "../../../../shared/src/index";
import { api, sessionHref } from "../../services/api";
import { errorMessage } from "../../utils/errorMessage";
export function ConversationHistory({
  session,
  busy,
  onNew,
}: {
  session: Session;
  busy: boolean;
  onNew: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<{ id: string; updatedAt: string }[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function load(cursor?: string) {
    const result = await api<{
      sessions: typeof rows;
      nextCursor: string | null;
    }>(`/plans/${session.planId}/sessions${cursor ? `?cursor=${cursor}` : ""}`);
    setRows((old) => (cursor ? [...old, ...result.sessions] : result.sessions));
    setCursor(result.nextCursor);
  }
  useEffect(() => {
    setRows([]);
    setError("");
    void load().catch((e) => setError(errorMessage(e)));
  }, [session.planId, session.id]);
  async function select(id: string) {
    try {
      const data = await api<{ selection: { revision: number } }>("/plans");
      await api(`/plans/${session.planId}/select`, "POST", {
        revision: data.selection.revision,
        sessionId: id,
      });
      navigate(sessionHref(id, "chat"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="conversation-toolbar">
      <label className="sr-only" htmlFor="conversation-history">
        Conversation history
      </label>
      <select
        id="conversation-history"
        disabled={busy}
        value={session.id}
        onChange={(e) => void select(e.target.value)}
      >
        {!rows.some((r) => r.id === session.id) && (
          <option value={session.id}>Current conversation</option>
        )}
        {rows.map((r) => (
          <option key={r.id} value={r.id}>
            {r.id === session.id ? "Current conversation" : "Conversation"} ·{" "}
            {new Date(r.updatedAt).toLocaleString()}
          </option>
        ))}
      </select>
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
      <button
        className="text-link"
        disabled={busy || !!session.plan?.archivedAt}
        onClick={() => void onNew()}
      >
        <Plus size={15} />
        New conversation
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
