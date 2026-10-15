import "./Canvas.css";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Session } from "../../../../shared/src/index";
import type { Next } from "../../types/session";
import { api, sessionHref } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
type Node = {
  id: string;
  title: string;
  status: string;
  purpose: string;
  evidence: string[];
  dependencies: string[];
  alternatives: string[];
};
type CanvasData = {
  graph: {
    nodes: Node[];
    edges: { from: string; to: string; label: string }[];
  };
  note: string;
};
export function Canvas({
  session,
  assess,
  busy,
  next,
}: {
  session: Session;
  assess: () => Promise<void>;
  busy: boolean;
  next: Next;
}) {
  const [data, setData] = useState<CanvasData | null>(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    setData(null);
    setError("");
    void api<CanvasData>(`/sessions/${session.id}/canvas`)
      .then((r) => {
        if (current) {
          setData(r);
          setSelected(r.graph.nodes[0]?.id ?? "");
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [session.id, session.revision]);
  const active = data?.graph.nodes.find((n) => n.id === selected);
  return (
    <section className="canvas">
      <header>
        <p className="eyebrow">Solution canvas</p>
        <h1>See how it could fit together.</h1>
        <p className="lead">
          Select a step to explore its purpose, alternatives and open decisions.
        </p>
      </header>
      <ErrorBox error={error} />
      {!data && !error && (
        <p role="status">Connecting your project information…</p>
      )}
      {data && (
        <div className="canvas-workspace">
          <div
            className="canvas-map"
            role="group"
            aria-label="Project workflow"
          >
            {data.graph.nodes.map((n) => (
              <div className="canvas-step" key={n.id}>
                <button
                  className={`canvas-node ${n.status}`}
                  aria-pressed={selected === n.id}
                  onClick={() => setSelected(n.id)}
                >
                  <small>
                    {n.status === "reported"
                      ? "You described"
                      : n.status === "exploratory"
                        ? "Possibility to explore"
                        : "Proposed · verify before use"}
                  </small>
                  <strong>{n.title}</strong>
                </button>
                {data.graph.edges
                  .filter((e) => e.from === n.id)
                  .map((e) => (
                    <button
                      className="canvas-edge"
                      key={`${e.from}-${e.to}`}
                      onClick={() => setSelected(e.to)}
                      aria-label={`${n.title} connects to ${data.graph.nodes.find((x) => x.id === e.to)?.title}: ${e.label}`}
                    >
                      ↓ {e.label} →{" "}
                      {data.graph.nodes.find((x) => x.id === e.to)?.title}
                    </button>
                  ))}
              </div>
            ))}
          </div>
          <aside className="canvas-detail" aria-label="Selected component">
            {active && (
              <>
                <p className="eyebrow">
                  {active.status === "reported"
                    ? "User-reported information"
                    : "Unverified proposal"}
                </p>
                <h2>{active.title}</h2>
                <p>{active.purpose}</p>
                {!!active.dependencies.length && (
                  <>
                    <h3>Before choosing</h3>
                    <ul>
                      {active.dependencies.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
                {!!active.alternatives.length && (
                  <>
                    <h3>Alternatives</h3>
                    <ul>
                      {active.alternatives
                        .filter((x) => !x.startsWith("Reference "))
                        .map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                    </ul>
                  </>
                )}
                {!!active.evidence.length && (
                  <details>
                    <summary>Supporting information</summary>
                    {active.evidence.map((x, i) => (
                      <p key={i}>{x.replace(/^\w+: /, "")}</p>
                    ))}
                  </details>
                )}
                <Link
                  className="button"
                  to={`${sessionHref(session.id, "chat")}?component=${encodeURIComponent(active.title)}`}
                >
                  Discuss this step
                </Link>
              </>
            )}
          </aside>
        </div>
      )}
      <div className="canvas-actions">
        <p className="fine-print">{data?.note}</p>
        {next.readiness.canAssess && (
          <button
            className="button"
            disabled={busy}
            onClick={() => void assess().catch((e) => setError(e.message))}
          >
            Save an assessment
          </button>
        )}
      </div>
    </section>
  );
}
