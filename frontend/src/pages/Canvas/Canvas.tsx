import "./Canvas.css";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type {
  CanvasState,
  ConsultingBrief,
  Session,
} from "../../../../shared/src/index";
import type { Next } from "../../types/session";
import { api, sessionHref } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
type Node = {
  id: string;
  title: string;
  status: string;
  purpose: string;
  evidence: string[];
  dependencies: string[];
  alternatives: string[];
  group?: string;
  sourceKey?: string;
  decision?: string;
};
type CanvasData = {
  revision: number;
  projectRevision: number;
  state: CanvasState;
  consulting?: ConsultingBrief;
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
  onChanged,
}: {
  session: Session;
  assess: () => Promise<void>;
  busy: boolean;
  next: Next;
  onChanged: () => Promise<void>;
}) {
  const [data, setData] = useState<CanvasData | null>(null),
    [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [editing, setEditing] = useState(false),
    [adding, setAdding] = useState(false),
    [title, setTitle] = useState(""),
    [notes, setNotes] = useState(""),
    [kind, setKind] = useState<"idea" | "constraint" | "decision">("idea"),
    [undo, setUndo] = useState<CanvasState | null>(null),
    [confirmFact, setConfirmFact] = useState(false),
    [report, setReport] = useState<{ reportId: string; stale: boolean } | null>(
      null,
    );
  const graphRef = useRef<HTMLDivElement>(null),
    marker = useId().replace(/:/g, "");
  const [lines, setLines] = useState<{ d: string; label: string }[]>([]),
    [size, setSize] = useState({ width: 1, height: 1 });
  async function load() {
    const result = await api<CanvasData>(`/sessions/${session.id}/canvas`);
    setData(result);
    setSelected((old) =>
      result.graph.nodes.some((n) => n.id === old)
        ? old
        : (result.graph.nodes[0]?.id ?? ""),
    );
  }
  useEffect(() => {
    let current = true;
    setData(null);
    setError("");
    void api<CanvasData>(`/sessions/${session.id}/canvas`)
      .then((r) => {
        if (current) {
          setData(r);
          setSelected((old) =>
            r.graph.nodes.some((n) => n.id === old)
              ? old
              : (r.graph.nodes[0]?.id ?? ""),
          );
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    void api<{ reportId: string; stale: boolean }>(
      `/sessions/${session.id}/report-status`,
    )
      .then((r) => {
        if (current) setReport(r);
      })
      .catch(() => {
        if (current) setReport(null);
      });
    return () => {
      current = false;
    };
  }, [session.id, session.revision]);
  useLayoutEffect(() => {
    const graph = graphRef.current;
    if (!graph || !data) return;
    const measure = () => {
      const base = graph.getBoundingClientRect();
      const columns = [...graph.querySelectorAll<HTMLElement>(".canvas-group")];
      setSize({ width: graph.scrollWidth, height: graph.scrollHeight });
      const groupNames = ["context", "directions", "next"];
      setLines(
        columns.slice(0, -1).flatMap((column, i) => {
          const related = data.graph.edges.some((e) => {
            const from = data.graph.nodes.find((n) => n.id === e.from);
            const to = data.graph.nodes.find((n) => n.id === e.to);
            return (
              from?.group === groupNames[i] && to?.group === groupNames[i + 1]
            );
          });
          const a = column.getBoundingClientRect(),
            b = columns[i + 1].getBoundingClientRect();
          if (!related || b.left <= a.right) return [];
          const x = a.right - base.left + 4,
            tx = b.left - base.left - 4;
          return [
            {
              d: `M ${x} 10 L ${tx} 10`,
              label:
                "Grouped project relationship; select a component for its exact connections",
            },
          ];
        }),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(graph);
    measure();
    return () => observer.disconnect();
  }, [data]);
  const active = data?.graph.nodes.find((n) => n.id === selected),
    archived = !!session.plan?.archivedAt;
  async function save(state: CanvasState, allowUndo = true) {
    if (!data || saving) return;
    setSaving(true);
    setError("");
    try {
      await api(`/plans/${session.planId}/canvas`, "PUT", {
        revision: data.projectRevision,
        state,
      });
      if (allowUndo) setUndo(data.state);
      else setUndo(null);
      await onChanged();
      await load();
      setEditing(false);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the canvas.");
    } finally {
      setSaving(false);
    }
  }
  async function correct() {
    if (!active?.sourceKey) return;
    setSaving(true);
    setError("");
    try {
      const latest = await api<Session>(`/sessions/${session.id}`);
      await api(`/sessions/${session.id}/answers`, "PUT", {
        revision: latest.revision,
        questionId: active.sourceKey,
        value: notes,
      });
      await onChanged();
      await load();
      setConfirmFact(false);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update this fact.");
    } finally {
      setSaving(false);
    }
  }
  const renderNode = (n: Node) => (
    <div className="canvas-step" key={n.id}>
      <button
        data-node-id={n.id}
        className={`canvas-node ${n.status}`}
        aria-pressed={selected === n.id}
        onClick={() => {
          setSelected(n.id);
          setEditing(false);
        }}
      >
        <small>
          {n.decision === "hypothesis"
            ? "Proposed direction"
            : n.decision === "selected"
              ? "Selected for exploration"
              : n.decision === "developing"
                ? "Being developed"
                : n.decision === "rejected"
                  ? "Set aside"
                  : (n.decision ??
                    (n.status === "reported"
                      ? "You described"
                      : "Proposed component"))}
        </small>
        <strong>{n.title}</strong>
      </button>
    </div>
  );
  const groups = [
    ["context", "Your starting point"],
    [
      "directions",
      session.answers.some(
        (a) => a.questionId === "stage" && a.value === "specific",
      )
        ? "Solution components"
        : data?.consulting?.approaches
          ? "Proposed approach and capabilities"
          : "Directions to explore",
    ],
    ["next", "Next decisions"],
  ];
  return (
    <section className="canvas">
      <header>
        <p className="eyebrow">Solution canvas</p>
        <h1>See how it could fit together.</h1>
        <p className="lead">
          Follow the connections. Select a step to inspect its basis, refine an
          idea or record a decision.
        </p>
      </header>
      <ErrorBox error={error} />
      <div className="canvas-actions">
        <div className="actions">
          <button
            className="button"
            disabled={saving || archived}
            onClick={() => {
              setAdding((v) => !v);
              setEditing(false);
              setTitle("");
              setNotes("");
            }}
          >
            Add an idea or constraint
          </button>
          {undo && (
            <button
              className="text-link"
              disabled={saving || archived}
              onClick={() => {
                const previous = undo;
                void save(previous, false);
              }}
            >
              Undo last canvas change
            </button>
          )}
        </div>
        <span className="badge">
          Live workspace · saved reports stay unchanged
        </span>
      </div>
      {adding && (
        <form
          className="canvas-edit"
          onSubmit={(e) => {
            e.preventDefault();
            if (data)
              void save({
                ...data.state,
                additions: [
                  ...data.state.additions,
                  {
                    id: crypto.randomUUID(),
                    kind,
                    title: title.trim(),
                    notes: notes.trim(),
                  },
                ],
              });
          }}
        >
          <label>
            What are you adding?
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="idea">Idea</option>
              <option value="constraint">Constraint</option>
              <option value="decision">Decision</option>
            </select>
          </label>
          <label>
            Title
            <input
              required
              minLength={2}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Project note
            <textarea
              required
              minLength={2}
              maxLength={1200}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button className="button" disabled={saving}>
            Save to this project
          </button>
        </form>
      )}
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
            <div className="canvas-graph" ref={graphRef}>
              <svg
                className="canvas-connections"
                width={size.width}
                height={size.height}
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id={marker}
                    markerWidth="7"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path
                      d="M1,1 L6,4 L1,7"
                      fill="none"
                      stroke="currentColor"
                    />
                  </marker>
                </defs>
                {lines.map((line, i) => (
                  <path
                    key={i}
                    d={line.d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    markerEnd={`url(#${marker})`}
                  >
                    <title>{line.label}</title>
                  </path>
                ))}
              </svg>
              {groups.map(([group, label]) => (
                <div className="canvas-group" key={group}>
                  <h2>{label}</h2>
                  {data.graph.nodes
                    .filter(
                      (n) =>
                        (n.group ?? "directions") === group &&
                        !n.id.startsWith("requirement-"),
                    )
                    .map(renderNode)}
                  {group === "directions" &&
                    (
                      [
                        "essential",
                        "optional",
                        "deferred",
                        "unconfirmed",
                      ] as const
                    ).map((priority) => {
                      const items = data.graph.nodes.filter(
                        (n) =>
                          n.id.startsWith("requirement-") &&
                          n.decision === priority,
                      );
                      return items.length ? (
                        <details
                          className="canvas-capability-group"
                          key={priority}
                          open={
                            items.some((n) => n.id === selected) || undefined
                          }
                        >
                          <summary>
                            {priority === "unconfirmed"
                              ? "Needs confirmation"
                              : `${priority[0].toUpperCase()}${priority.slice(1)} capabilities`}{" "}
                            · {items.length}
                          </summary>
                          {items.map(renderNode)}
                        </details>
                      ) : null;
                    })}
                </div>
              ))}
            </div>
          </div>
          <aside className="canvas-detail" aria-label="Selected component">
            {active ? (
              <>
                <p className="badge">
                  {active.status === "reported"
                    ? "User-reported information"
                    : "A proposal, not a confirmed requirement"}
                </p>
                <h2>{active.title}</h2>
                <p>{active.purpose}</p>
                <details className="canvas-relationships">
                  <summary>Related components and decisions</summary>
                  {data.graph.edges
                    .filter((e) => e.from === active.id)
                    .map((e, i) => (
                      <button
                        key={i}
                        className="canvas-edge"
                        onClick={() => setSelected(e.to)}
                      >
                        {e.label} →{" "}
                        {data.graph.nodes.find((n) => n.id === e.to)?.title}
                      </button>
                    ))}
                </details>
                {!!active.dependencies.length && (
                  <>
                    <h3>What to check</h3>
                    <ul>
                      {active.dependencies.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
                {!!active.alternatives.length && (
                  <details>
                    <summary>Alternatives and uncertainties</summary>
                    {active.alternatives.map((s) => (
                      <p key={s}>{s}</p>
                    ))}
                  </details>
                )}
                {!!active.evidence.length && (
                  <details>
                    <summary>Supporting information</summary>
                    {[...new Set(active.evidence)]
                      .filter((s) => s !== active.purpose)
                      .map((s) => (
                        <p key={s}>{s}</p>
                      ))}
                  </details>
                )}
                {!archived && active.id.startsWith("requirement-") && (
                  <label>
                    Requirement priority
                    <select
                      aria-label="Requirement priority"
                      value={
                        data.consulting?.requirements?.find(
                          (r) => r.id === active.id,
                        )?.priority ?? "unconfirmed"
                      }
                      disabled={saving}
                      onChange={(e) =>
                        void save({
                          ...data.state,
                          edits: {
                            ...data.state.edits,
                            [active.id]: {
                              ...data.state.edits[active.id],
                              priority: e.target.value as
                                | "essential"
                                | "optional"
                                | "deferred"
                                | "unconfirmed",
                            },
                          },
                        })
                      }
                    >
                      <option value="essential">Essential</option>
                      <option value="optional">Optional</option>
                      <option value="deferred">Deferred</option>
                      <option value="unconfirmed">Needs confirmation</option>
                    </select>
                  </label>
                )}
                {active.decision === "developing" && (
                  <div className="canvas-development">
                    <h3>Develop a practical plan</h3>
                    <p>
                      Review essential requirements, dependencies and
                      constraints. Define a pilot and its success criteria, then
                      record your refinement here or continue in Chat.
                    </p>
                    <ol>
                      {data.consulting?.directions
                        .find((d) => d.id === active.id)
                        ?.validation.map((v) => (
                          <li key={v.kind}>
                            <strong>{v.kind}</strong>: {v.action}
                          </li>
                        ))}
                    </ol>
                  </div>
                )}
                {!archived && (
                  <>
                    <div className="actions">
                      <button
                        className="button"
                        onClick={() => {
                          setEditing((v) => !v);
                          setAdding(false);
                          setTitle(active.title);
                          setNotes(
                            active.sourceKey
                              ? String(
                                  session.answers.find(
                                    (a) => a.questionId === active.sourceKey,
                                  )?.value ?? active.purpose,
                                )
                              : active.purpose,
                          );
                        }}
                      >
                        {active.sourceKey
                          ? "Correct this fact"
                          : "Refine this step"}
                      </button>
                      {active.status !== "reported" &&
                        [
                          "selected",
                          "developing",
                          "exploring",
                          "deferred",
                          "rejected",
                        ].map((decision) => (
                          <button
                            key={decision}
                            className="text-link"
                            disabled={saving || active.decision === decision}
                            aria-pressed={active.decision === decision}
                            onClick={() =>
                              void save({
                                ...data.state,
                                edits: {
                                  ...data.state.edits,
                                  [active.id]: {
                                    ...data.state.edits[active.id],
                                    decision: decision as
                                      | "developing"
                                      | "exploring"
                                      | "selected"
                                      | "deferred"
                                      | "rejected",
                                  },
                                },
                              })
                            }
                          >
                            {decision === "selected"
                              ? "Select this direction"
                              : decision === "developing"
                                ? "Develop this direction"
                                : decision === "exploring"
                                  ? "Reconsider"
                                  : decision === "deferred"
                                    ? "Defer"
                                    : "Set aside"}
                          </button>
                        ))}
                    </div>
                    {editing && (
                      <form
                        className="canvas-edit"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (active.sourceKey) setConfirmFact(true);
                          else
                            void save({
                              ...data.state,
                              edits: {
                                ...data.state.edits,
                                [active.id]: {
                                  ...data.state.edits[active.id],
                                  title,
                                  notes,
                                },
                              },
                            });
                        }}
                      >
                        {!active.sourceKey && (
                          <label>
                            Title
                            <input
                              required
                              minLength={2}
                              maxLength={100}
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                            />
                          </label>
                        )}
                        <label>
                          {active.sourceKey
                            ? "Corrected answer"
                            : "Your refinement"}
                          <textarea
                            required
                            minLength={2}
                            maxLength={active.sourceKey ? 4000 : 1200}
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </label>
                        <p className="fine-print">
                          This changes the live project. Existing saved reports
                          remain unchanged.
                        </p>
                        <button className="button" disabled={saving}>
                          {active.sourceKey
                            ? "Review correction"
                            : "Save refinement"}
                        </button>
                      </form>
                    )}
                  </>
                )}
                <Link
                  className="button"
                  to={`${sessionHref(session.id, "chat")}?component=${encodeURIComponent(active.title)}&node=${encodeURIComponent(active.id)}`}
                >
                  {active.decision === "selected" ||
                  active.decision === "developing"
                    ? "Develop this direction in Chat"
                    : active.decision === "deferred"
                      ? "Discuss this deferred component in Chat"
                      : active.decision === "rejected"
                        ? "Reconsider this component in Chat"
                        : "Discuss this component in Chat"}
                </Link>
              </>
            ) : (
              <p>Select a step to explore it.</p>
            )}
          </aside>
        </div>
      )}
      <div className="canvas-actions">
        <p className="fine-print">
          {report && !report.stale
            ? "Your saved assessment already reflects this information. Select or inspect steps without creating duplicate snapshots."
            : "A new assessment captures current answers and recorded decisions as a separate saved version."}
        </p>
        {report && !report.stale ? (
          <Link className="text-link" to={sessionHref(session.id, "analysis")}>
            View saved assessment
          </Link>
        ) : (
          <button
            className="button"
            disabled={busy || saving || !next.readiness.canAssess || archived}
            onClick={() => void assess().catch((e) => setError(e.message))}
          >
            {report ? "Prepare an updated assessment" : "Prepare an assessment"}
          </button>
        )}
      </div>
      {confirmFact && (
        <ConfirmDialog
          title="Update this project fact?"
          confirmLabel="Save correction"
          busyLabel="Saving…"
          busy={saving}
          error={error}
          onClose={() => setConfirmFact(false)}
          onConfirm={() => void correct()}
        >
          <p>{notes}</p>
          <p>
            This updates the guided answer and future guidance. Earlier reports
            stay unchanged.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
