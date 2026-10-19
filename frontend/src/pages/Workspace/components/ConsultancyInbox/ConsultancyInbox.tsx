import { useEffect, useState } from "react";
import { api } from "../../../../services/api";
import type { Solution } from "../../../../../../shared/src/solutions";
import { ErrorBox } from "../../../../components/ErrorBox/ErrorBox";
type ReceivedRequest = {
  id: string;
  notes: string;
  status: string;
  createdAt: string;
  plan: { title: string; admin: { name: string | null; email: string } };
  scope: {
    solutions: Solution[];
    constraints: { quote: string }[];
    projectRevision: number;
  };
};
export function ConsultancyInbox() {
  const [rows, setRows] = useState<ReceivedRequest[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load(after?: string) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{
        requests: ReceivedRequest[];
        nextCursor: string | null;
      }>(`/consultancy-requests${after ? `?cursor=${after}` : ""}`);
      setRows((previous) =>
        after ? [...previous, ...result.requests] : result.requests,
      );
      setCursor(result.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not retrieve requests.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <section className="quiet-card">
      <h2>Consultancy requests</h2>
      <p>
        Received scope for review. Requests do not commission work or assign a
        consultant.
      </p>
      <ErrorBox error={error} />
      <button className="button" disabled={busy} onClick={() => void load()}>
        Refresh requests
      </button>
      {!rows.length && !busy && !error && (
        <p>No consultancy requests received yet.</p>
      )}
      {rows.map((row) => (
        <details key={row.id}>
          <summary>
            {row.plan.title} · {row.status} ·{" "}
            {new Date(row.createdAt).toLocaleDateString()}
          </summary>
          <p>
            {row.plan.admin.name || "Account holder"} ·{" "}
            <a href={`mailto:${row.plan.admin.email}`}>
              {row.plan.admin.email}
            </a>
          </p>
          <p>
            Reference: {row.id} · Project revision {row.scope.projectRevision}
          </p>
          <p>{row.notes || "No additional notes."}</p>
          {row.scope.solutions.map((s) => (
            <div key={s.id}>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <p>
                {s.source === "user" ? "User proposal" : "Recommendation"} ·
                Scope revision {s.revision}
              </p>
              <ul>
                {s.requirements.map((r) => (
                  <li key={r.id}>
                    {r.label} · {r.priority}
                  </li>
                ))}
                {s.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          {row.scope.constraints.length > 0 && (
            <>
              <h3>Recorded constraints</h3>
              <ul>
                {row.scope.constraints.map((c, i) => (
                  <li key={i}>{c.quote}</li>
                ))}
              </ul>
            </>
          )}
        </details>
      ))}
      {cursor && (
        <button
          className="button"
          disabled={busy}
          onClick={() => void load(cursor)}
        >
          Load more requests
        </button>
      )}
    </section>
  );
}
