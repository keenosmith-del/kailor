import { ArrowRight,Plus } from "lucide-react";
import { useCallback,useEffect,useState,type FormEvent } from "react";
import { Link,useNavigate } from "react-router";
import type { Session } from "../../shared/src/index";
import { api } from "./api";
import { ErrorBox,errorMessage } from "./ui";
export function Workspace() {
  const [sessions, setSessions] = useState<(Session & { updatedAt: string })[]>(
      [],
    ),
    [personas, setPersonas] = useState<{ id: string; name: string }[]>([]),
    [cases, setCases] = useState<CaseItem[]>([]),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const load = useCallback(async () => {
    try {
      const [s, p, c] = await Promise.all([
        api<typeof sessions>("/sessions"),
        api<typeof personas>("/personas"),
        api<CaseItem[]>("/cases"),
      ]);
      setSessions(s);
      setPersonas(p);
      setCases(c);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function start(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const s = await api<Session>("/sessions", "POST", { name });
      navigate(`/sessions/${s.id}/discovery`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function simulate(id: string) {
    setBusy(true);
    setError("");
    try {
      const run = await api<{ sessionId: string }>("/simulations", "POST", {
        personaId: id,
      });
      navigate(`/sessions/${run.sessionId}/report`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="workspace">
      <p className="eyebrow">your workspace</p>
      <h1>
        Make room for
        <br />
        what comes next.
      </h1>
      <div className="workspace-grid">
        <section>
          <h2>A new discovery</h2>
          <form onSubmit={start} className="inline-form">
            <label className="sr-only" htmlFor="subject">
              Business, person or project name
            </label>
            <input
              id="subject"
              placeholder="Business, person or project name"
              required
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="button primary" disabled={busy}>
              <Plus size={18} /> Begin
            </button>
          </form>
          <ErrorBox error={error} />
          <h2 className="section-heading">Pick up where you left off</h2>
          <div className="session-list">
            {sessions.length === 0 && (
              <p className="muted">Your saved discoveries will appear here.</p>
            )}
            {sessions.map((s) => (
              <Link
                className="session-row"
                key={s.id}
                to={`/sessions/${s.id}/discovery`}
              >
                <div>
                  <strong>{s.subject.name}</strong>
                  <small>
                    {s.synthetic ? "Synthetic evaluation" : "Private discovery"}{" "}
                    · {new Date(s.updatedAt).toLocaleDateString()}
                  </small>
                </div>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </section>
        <aside className="quiet-card">
          <p className="eyebrow">learning thoughtfully</p>
          <h2>Try a different perspective.</h2>
          <p>
            Synthetic personas exercise the same discovery and assessment
            services. They do not represent real clients or results.
          </p>
          {personas.map((p) => (
            <button
              className="persona"
              disabled={busy}
              key={p.id}
              onClick={() => void simulate(p.id)}
            >
              {p.name}
              <ArrowRight size={16} />
            </button>
          ))}
        </aside>
      </div>
      <section className="review-section">
        <h2>Reference knowledge review</h2>
        <p className="muted">
          Sanitize the reusable pattern before approval. Source classification
          is preserved.
        </p>
        {cases
          .filter((c) => c.sourceType !== "seed")
          .map((c) => (
            <CaseReview key={c.id} item={c} onSaved={load} />
          ))}
        {!cases.some((c) => c.sourceType !== "seed") && (
          <p className="muted">
            Run a synthetic persona to create a pending reference.
          </p>
        )}
      </section>
    </main>
  );
}
type CaseItem = {
  id: string;
  title: string;
  sourceType: string;
  reviewStatus: string;
  pattern: Record<string, unknown>;
};
function CaseReview({
  item,
  onSaved,
}: {
  item: CaseItem;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title),
    [pattern, setPattern] = useState(JSON.stringify(item.pattern, null, 2)),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function review(status: string) {
    setBusy(true);
    try {
      await api(`/cases/${item.id}/review`, "PUT", {
        status,
        title,
        pattern: JSON.parse(pattern),
        notes,
      });
      await onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="case-review">
      <summary>
        {item.title}
        <span className="badge">
          {item.sourceType} · {item.reviewStatus}
        </span>
      </summary>
      <label>
        Reusable title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Sanitized pattern (JSON)
        <textarea
          rows={8}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
      </label>
      <label>
        Review notes (required)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Confirm relevance and removal of identifying information."
        />
      </label>
      <ErrorBox error={error} />
      <div className="actions">
        <button
          className="button primary"
          disabled={busy || notes.trim().length < 10}
          onClick={() => void review("approved")}
        >
          Approve reference
        </button>
        <button
          className="button"
          disabled={busy || notes.trim().length < 10}
          onClick={() => void review("rejected")}
        >
          Reject
        </button>
      </div>
    </details>
  );
}
