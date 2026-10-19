import "./Canvas.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { CanvasState, Session } from "../../../../shared/src/index";
import {
  solutionStatus,
  unresolvedSelections,
  type Solution,
  type SolutionCanvas,
} from "../../../../shared/src/solutions";
import type { Next } from "../../types/session";
import { api, downloadReasoning, sessionHref } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { SolutionVisual } from "./SolutionVisual";
import { SolutionModal } from "./SolutionModal";
import { SolutionDetail } from "./SolutionDetail";
import { RequestReview } from "./RequestReview";

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
  const [data, setData] = useState<SolutionCanvas | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const [opened, setOpened] = useState(""),
    [reviewing, setReviewing] = useState(
      () =>
        new URLSearchParams(window.location.search).get("resume") ===
        "consultancy",
    ),
    [adding, setAdding] = useState(false),
    [undo, setUndo] = useState<CanvasState | null>(null);
  const [noteId, setNoteId] = useState(""),
    [kind, setKind] = useState<"idea" | "constraint" | "decision">("idea"),
    [title, setTitle] = useState(""),
    [notes, setNotes] = useState("");
  const sequence = useRef(0),
    sessionId = useRef(session.id),
    mutating = useRef(false);
  const archived = !!session.plan?.archivedAt;
  useEffect(() => {
    const request = ++sequence.current;
    if (sessionId.current !== session.id) {
      sessionId.current = session.id;
      setData(null);
      setOpened("");
      setReviewing(false);
      setAdding(false);
      setUndo(null);
      setTitle("");
      setNotes("");
    }
    setError("");
    void api<SolutionCanvas>(`/sessions/${session.id}/canvas`)
      .then((result) => {
        if (sequence.current === request) setData(result);
      })
      .catch((e) => {
        if (sequence.current === request) setError(e.message);
      });
    return () => {
      sequence.current++;
    };
  }, [session.id, session.revision]);
  async function reload() {
    const request = ++sequence.current;
    const result = await api<SolutionCanvas>(`/sessions/${session.id}/canvas`);
    if (sessionId.current === session.id && request === sequence.current)
      setData(result);
  }
  async function save(state: CanvasState, remember = true): Promise<boolean> {
    if (!data || mutating.current || archived) return false;
    mutating.current = true;
    setSaving(true);
    setError("");
    try {
      await api(`/plans/${session.planId}/canvas`, "PUT", {
        revision: data.projectRevision,
        state,
      });
      setUndo(remember ? data.state : null);
      if (sessionId.current !== session.id) return false;
      await reload();
      await onChanged();
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your draft is retained.",
      );
      return false;
    } finally {
      mutating.current = false;
      setSaving(false);
    }
  }
  async function correct(key: string, value: string): Promise<boolean> {
    if (mutating.current || archived) return false;
    mutating.current = true;
    setSaving(true);
    setError("");
    try {
      await api(`/sessions/${session.id}/answers`, "PUT", {
        revision: session.revision,
        questionId: key,
        value,
      });
      setUndo(null);
      if (sessionId.current !== session.id) return false;
      await reload();
      await onChanged();
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not correct this information.",
      );
      return false;
    } finally {
      mutating.current = false;
      setSaving(false);
    }
  }
  function select(solution: Solution, force?: boolean) {
    if (!data) return;
    const selected = force ?? (solution.reviewRequired || !solution.selected);
    void save({
      ...data.state,
      edits: {
        ...data.state.edits,
        [solution.id]: {
          ...data.state.edits[solution.id],
          decision: selected ? "selected" : "exploring",
        },
      },
      selections: {
        ...data.state.selections,
        [solution.id]: {
          selected,
          basisRevision: solution.revision,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }
  const active = data?.solutions.find((s) => s.id === opened),
    selections = data?.solutions.filter((s) => s.selected) ?? [];
  const missingSelections = data
    ? unresolvedSelections(data.state, data.solutions)
    : [];
  function discuss(solution: Solution) {
    return `${sessionHref(session.id, "chat")}?${new URLSearchParams({ solution: solution.id, component: solution.title, node: solution.id }).toString()}`;
  }
  async function download(solution: Solution) {
    try {
      await downloadReasoning(session.id, solution.id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not download reasoning.",
      );
    }
  }
  return (
    <section className="canvas solution-canvas">
      <header>
        <h1>
          Your recommended
          <br className="solution-heading-break" /> solutions.
        </h1>
        <p className="lead">
          Explore what could work for your project. Refine the details, choose
          what matters and decide how you’d like to move forward.
        </p>
      </header>
      <ErrorBox error={error} />
      {error && data && !opened && (
        <button
          className="text-link"
          onClick={() => void reload().catch((e) => setError(e.message))}
        >
          Reload latest solutions
        </button>
      )}
      {!data && !error && (
        <p className="solution-empty" role="status">
          Preparing your project’s solutions…
        </p>
      )}
      {!data && error && (
        <button
          className="button"
          onClick={() => void reload().catch((e) => setError(e.message))}
        >
          Try again
        </button>
      )}
      {data && (
        <>
          {data.solutions.length ? (
            <div
              className={`solution-collection ${data.solutions.length === 1 ? "solution-collection--single" : ""}`}
              aria-label="Recommended solutions"
            >
              {data.solutions.map((solution) => (
                <article
                  key={solution.id}
                  className={`solution-tile ${solution.selected ? "is-selected" : ""}`}
                >
                  <button
                    className="solution-tile-open"
                    aria-label={`View ${solution.title}`}
                    onClick={() => setOpened(solution.id)}
                  >
                    <SolutionVisual
                      type={solution.visual}
                      title={solution.title}
                    />
                    <div className="solution-tile-copy">
                      <span className="solution-status">
                        {solutionStatus(solution)}
                      </span>
                      <h2>{solution.title}</h2>
                      <p>{solution.description}</p>
                      <span className="solution-view-label">
                        View details <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </button>
                  <label className="solution-select">
                    <input
                      type="checkbox"
                      checked={solution.selected}
                      disabled={saving || archived}
                      onChange={(e) => select(solution, e.target.checked)}
                    />
                    <span>
                      Select<span className="sr-only"> {solution.title}</span>
                    </span>
                  </label>
                </article>
              ))}
            </div>
          ) : (
            <div className="solution-empty">
              <h2>A little more context first.</h2>
              <p>
                Tell kailor about your goals and current situation so it can
                identify a useful solution.
              </p>
              <div className="actions">
                <Link
                  className="button"
                  to={sessionHref(session.id, "discovery")}
                >
                  Continue discovery
                </Link>
                <Link
                  className="text-link"
                  to={sessionHref(session.id, "chat")}
                >
                  Discuss your project in Chat
                </Link>
              </div>
            </div>
          )}
          {!!missingSelections.length && (
            <div className="solution-notice">
              <p>
                A previously selected direction is no longer in the current
                recommendations. Its decision is retained. Review your project
                context before proceeding.
              </p>
              {missingSelections.map((id) => (
                <button
                  key={id}
                  className="text-link"
                  disabled={saving || archived}
                  onClick={() =>
                    void save({
                      ...data.state,
                      edits: {
                        ...data.state.edits,
                        [id]: {
                          ...data.state.edits[id],
                          decision: "exploring",
                        },
                      },
                      selections: {
                        ...data.state.selections,
                        [id]: {
                          basisRevision: 0,
                          updatedAt: new Date().toISOString(),
                          ...data.state.selections?.[id],
                          selected: false,
                        },
                      },
                    })
                  }
                >
                  Release previous selection:{" "}
                  {data.state.edits[id]?.title ?? id}
                </button>
              ))}
            </div>
          )}
          {selections.length > 0 && (
            <div className="solution-selection-summary" role="status">
              <span>
                <strong>
                  {selections.length}{" "}
                  {selections.length === 1 ? "solution" : "solutions"} selected
                </strong>
                <small>For consideration. You decide the next step.</small>
              </span>
              <button
                className="button"
                disabled={saving || archived}
                onClick={() => setReviewing(true)}
              >
                Review selected solutions
              </button>
            </div>
          )}
          <nav className="solution-support" aria-label="Project options">
            <button
              className="text-link"
              disabled={saving || archived}
              onClick={() => {
                setAdding(true);
                setNoteId("");
                setTitle("");
                setNotes("");
              }}
            >
              Propose a solution or add a note
            </button>
            <Link to={sessionHref(session.id, "analysis")}>
              Explore the analysis
            </Link>
            <Link to={sessionHref(session.id, "discovery")}>
              Refine project information
            </Link>
            <Link to={sessionHref(session.id, "chat")}>Continue in Chat</Link>
            {undo && (
              <button
                className="text-link"
                disabled={saving || archived}
                onClick={() => void save(undo, false)}
              >
                Undo last canvas change
              </button>
            )}
          </nav>
          {data.state.additions.some((note) => note.kind !== "idea") && (
            <details className="solution-project-notes">
              <summary>Your project notes</summary>
              {data.state.additions
                .filter((note) => note.kind !== "idea")
                .map((note) => (
                  <div key={note.id}>
                    <h3>{data.state.edits[note.id]?.title ?? note.title}</h3>
                    <p>{data.state.edits[note.id]?.notes ?? note.notes}</p>
                    <button
                      className="text-link"
                      disabled={saving || archived}
                      onClick={() => {
                        setNoteId(note.id);
                        setTitle(
                          data.state.edits[note.id]?.title ?? note.title,
                        );
                        setNotes(
                          data.state.edits[note.id]?.notes ?? note.notes,
                        );
                        setKind(note.kind);
                        setAdding(true);
                      }}
                    >
                      Edit note
                    </button>
                  </div>
                ))}
            </details>
          )}
          <div className="solution-assessment">
            <p>
              Keep a separate assessment of your latest project information.
              Saved versions stay unchanged.
            </p>
            <button
              className="text-link"
              disabled={busy || saving || !next.readiness.canAssess || archived}
              onClick={() => void assess().catch((e) => setError(e.message))}
            >
              Prepare a current assessment
            </button>
          </div>
        </>
      )}
      {opened && data && (
        <SolutionModal
          title={active?.title ?? "This recommendation has changed"}
          hero={
            active && (
              <SolutionVisual type={active.visual} title={active.title} />
            )
          }
          description={
            active?.description ??
            "Your previous selection is retained. Review the current recommendations before proceeding."
          }
          onClose={() => setOpened("")}
          busy={saving}
        >
          {error && (
            <>
              <ErrorBox error={error} />
              <button
                className="text-link"
                onClick={() => void reload().catch((e) => setError(e.message))}
              >
                Reload latest solutions
              </button>
            </>
          )}
          {active && (
            <SolutionDetail
              key={active.id}
              solution={active}
              session={session}
              state={data.state}
              busy={saving}
              archived={archived}
              save={save}
              correct={correct}
              select={() => select(active)}
              discuss={discuss(active)}
              download={() => void download(active)}
              help={() => {
                if (!active.selected) select(active, true);
                setOpened("");
                setReviewing(true);
              }}
            />
          )}
        </SolutionModal>
      )}
      {reviewing && data && session.planId && (
        <SolutionModal
          title="Your selected solutions"
          description="Review the scope you’d like help with. You can change your choices before sending a request."
          onClose={() => setReviewing(false)}
          busy={saving}
        >
          <RequestReview
            solutions={selections}
            planId={session.planId}
            sessionId={session.id}
            projectRevision={data.projectRevision}
            busy={saving}
            onBusy={setSaving}
            onSubmitted={reload}
            unresolved={missingSelections.length > 0}
            change={(s) => select(s, false)}
          />
        </SolutionModal>
      )}
      {adding && data && (
        <SolutionModal
          title="Add to your project"
          description="Your idea will be kept as your proposal, ready to explore and refine."
          onClose={() => setAdding(false)}
          busy={saving}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save({
                  ...data.state,
                  additions: noteId
                    ? data.state.additions.map((note) =>
                        note.id === noteId
                          ? {
                              ...note,
                              kind,
                              title: title.trim(),
                              notes: notes.trim(),
                            }
                          : note,
                      )
                    : [
                        ...data.state.additions,
                        {
                          id: crypto.randomUUID(),
                          kind,
                          title: title.trim(),
                          notes: notes.trim(),
                        },
                      ],
                  edits: noteId
                    ? {
                        ...data.state.edits,
                        [noteId]: {
                          ...data.state.edits[noteId],
                          title: title.trim(),
                          notes: notes.trim(),
                        },
                      }
                    : data.state.edits,
                })
              )
                setAdding(false);
            }}
          >
            <label>
              What would you like to add?
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
              >
                <option value="idea">A proposed solution</option>
                <option value="constraint">A constraint</option>
                <option value="decision">A project decision</option>
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
              What should kailor know?
              <textarea
                required
                minLength={2}
                maxLength={1200}
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <button className="button" disabled={saving}>
              Save to this project
            </button>
            {error && <ErrorBox error={error} />}
          </form>
        </SolutionModal>
      )}
    </section>
  );
}
