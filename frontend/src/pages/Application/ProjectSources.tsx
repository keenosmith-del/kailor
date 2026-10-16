import { useEffect, useRef, useState } from "react";
import type { Session } from "../../../../shared/src/index";
import { api, uploadSource } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
type Source = {
  id: string;
  title: string;
  kind: string;
  status: string;
  url?: string;
  content?: string;
  createdAt: string;
};
export function ProjectSources({
  session,
  filter = "all",
}: {
  session: Session;
  filter?: string;
}) {
  const generation = useRef(0);
  const [adding, setAdding] = useState(false);
  const [rows, setRows] = useState<Source[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [selected, setSelected] = useState<Source | null>(null);
  const [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [kind, setKind] = useState("note"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  async function load(after?: string) {
    const started = generation.current;
    const result = await api<{ sources: Source[]; nextCursor: string | null }>(
      `/plans/${session.planId}/sources?category=${encodeURIComponent(["documents", "references", "notes"].includes(filter) ? filter : "all")}${after ? `&cursor=${after}` : ""}`,
    );
    if (started !== generation.current) return;
    setRows((old) => (after ? [...old, ...result.sources] : result.sources));
    setCursor(result.nextCursor);
  }
  useEffect(() => {
    generation.current++;
    setCursor(null);
    setError("");
    setRows([]);
    setSelected(null);
    void load().catch((e) => setError(e.message));
    return () => {
      generation.current++;
    };
  }, [session.planId, filter]);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save this resource.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="project-reports project-sources">
      <div className="resource-add-heading">
        <h2>Project resources</h2>
        {!session.plan?.archivedAt && (
          <button
            className="button"
            aria-expanded={adding}
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? "Close" : "Add a resource"}
          </button>
        )}
      </div>
      <ErrorBox error={error} />
      {notice && <p role="status">{notice}</p>}
      {adding && !session.plan?.archivedAt && (
        <div className="resource-add">
          <div className="actions">
            {[
              ["file", "Upload a document"],
              ["link", "Save a link"],
              ["note", "Add a project note"],
            ].map(([value, label]) => (
              <button
                className="button"
                key={value}
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {kind !== "file" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(async () => {
                  await api(
                    `/plans/${session.planId}/sources`,
                    "POST",
                    kind === "link"
                      ? { kind, title, url: content }
                      : { kind, title, content },
                  );
                  setContent("");
                  setTitle("");
                  setNotice("Resource saved.");
                });
              }}
            >
              <label>
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  required
                />
              </label>
              <label>
                {kind === "link" ? "URL" : "Reference text"}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={kind === "link" ? 2000 : 16000}
                  required
                  rows={4}
                />
              </label>
              <button
                className="button"
                disabled={busy || !!session.plan?.archivedAt}
              >
                Save resource
              </button>
            </form>
          )}
          {kind === "file" && (
            <>
              <label className="source-upload">
                Upload UTF-8 text or CSV
                <input
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv"
                  disabled={busy || !!session.plan?.archivedAt}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      void act(async () => {
                        await uploadSource(session.planId!, file);
                        setNotice(
                          "Text extracted successfully and saved as reference material.",
                        );
                      });
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="fine-print">
                64 KB per file, up to 16,000 extracted characters. PDF and Word
                extraction are unavailable. CSV is stored as text; formulas are
                never executed.
              </p>
            </>
          )}
        </div>
      )}
      {busy && <p role="status">Processing project material…</p>}
      {!rows.length && (
        <p className="muted">No supporting materials saved yet.</p>
      )}
      {rows
        .filter(
          (row) =>
            filter === "all" ||
            (filter === "notes" && row.kind === "note") ||
            (filter === "references" && row.kind === "link") ||
            (filter === "documents" &&
              row.kind !== "note" &&
              row.kind !== "link"),
        )
        .map((row) => (
          <article className="source-row" key={row.id}>
            <div>
              <button
                className="text-link"
                onClick={() =>
                  void api<Source>(`/plans/${session.planId}/sources/${row.id}`)
                    .then(setSelected)
                    .catch((e) => setError(e.message))
                }
              >
                {row.title}
              </button>
              <p>
                {row.kind === "link"
                  ? "Research link · not retrieved"
                  : row.kind === "note"
                    ? "Project knowledge"
                    : "Uploaded document · text extracted"}{" "}
                · {new Date(row.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              className="text-link"
              disabled={busy || !!session.plan?.archivedAt}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete “${row.title}”? Saved reports remain unchanged.`,
                  )
                )
                  void act(async () => {
                    await api(
                      `/plans/${session.planId}/sources/${row.id}`,
                      "DELETE",
                    );
                    if (selected?.id === row.id) setSelected(null);
                  });
              }}
            >
              Delete
            </button>
          </article>
        ))}
      {cursor && (
        <button
          className="button"
          onClick={() => void load(cursor).catch((e) => setError(e.message))}
        >
          More resources
        </button>
      )}
      {selected && (
        <section className="source-preview">
          <button className="text-link" onClick={() => setSelected(null)}>
            Close resource
          </button>
          <h3>{selected.title}</h3>
          {selected.url ? (
            <a href={selected.url} target="_blank" rel="noopener noreferrer">
              Open supplied link · unverified
            </a>
          ) : (
            <pre>{selected.content}</pre>
          )}
        </section>
      )}
    </section>
  );
}
