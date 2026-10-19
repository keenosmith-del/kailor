import { useState } from "react";
import { Link } from "react-router";
import type { CanvasState, Session } from "../../../../shared/src/index";
import {
  solutionStatus,
  type Solution,
} from "../../../../shared/src/solutions";
import { SolutionEditor } from "./SolutionEditor";
export function SolutionDetail({
  solution,
  session,
  state,
  busy,
  archived,
  save,
  correct,
  select,
  discuss,
  download,
  help,
}: {
  solution: Solution;
  session: Session;
  state: CanvasState;
  busy: boolean;
  archived: boolean;
  save: (state: CanvasState) => Promise<boolean>;
  correct: (key: string, value: string) => Promise<boolean>;
  select: () => void;
  discuss: string;
  download: () => void;
  help: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  return (
    <>
      <p className="solution-status">{solutionStatus(solution)}</p>
      {solution.request && (
        <p className="solution-notice">
          Professional help requested. Request state: {solution.request.status}.
          The submitted scope is retained separately; later edits do not change
          it.
        </p>
      )}
      {solution.reviewRequired && (
        <p className="solution-notice">
          Your project information has changed. Your selection is retained.
          Review the updated scope, then confirm it or deselect this solution.
        </p>
      )}
      <div className="solution-detail-actions">
        <button className="button" disabled={busy || archived} onClick={select}>
          {solution.reviewRequired
            ? "Confirm updated selection"
            : solution.selected
              ? "Deselect solution"
              : "Select this solution"}
        </button>
        <button
          className="text-link"
          disabled={busy || archived}
          onClick={() => {
            if (
              editing &&
              dirty &&
              !window.confirm(
                "Discard unsaved refinements? Choose Cancel to keep editing and save.",
              )
            )
              return;
            setDirty(false);
            setEditing(!editing);
          }}
        >
          {editing ? "Done editing" : "Edit solution"}
        </button>
      </div>
      {editing ? (
        <SolutionEditor
          solution={solution}
          session={session}
          state={state}
          busy={busy}
          save={save}
          correct={correct}
          onDirty={setDirty}
        />
      ) : (
        <>
          {solution.objective &&
            solution.objective !== solution.description && (
              <p>{solution.objective}</p>
            )}
          {(solution.requirements.length > 0 ||
            solution.includes.length > 0) && (
            <section>
              <h3>What this includes</h3>
              {solution.includes.length > 0 && (
                <ul>
                  {solution.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {(
                ["essential", "optional", "deferred", "unconfirmed"] as const
              ).map((priority) => {
                const requirements = solution.requirements.filter(
                  (r) => r.priority === priority,
                );
                return requirements.length ? (
                  <div className="solution-capabilities" key={priority}>
                    <h4>
                      {
                        {
                          essential: "Essential for the first phase",
                          optional: "Optional additions",
                          deferred: "What can come later",
                          unconfirmed: "Needs confirmation",
                        }[priority]
                      }
                    </h4>
                    <ul>
                      {requirements.map((r) => (
                        <li key={r.id}>
                          {r.label}
                          {r.conflict && <small>{r.conflict}</small>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })}
            </section>
          )}
          <section>
            <h3>Why this was recommended</h3>
            <p>{solution.why}</p>
          </section>
          {!!solution.facts.length && (
            <details>
              <summary>Based on what you told us</summary>
              {solution.facts.map((f) => (
                <p key={f.id}>
                  <strong>{f.label}</strong>
                  <br />
                  {f.value}
                </p>
              ))}
              <button
                className="text-link"
                disabled={archived}
                onClick={() => setEditing(true)}
              >
                Correct this information
              </button>
            </details>
          )}
          {!!solution.constraints.length && (
            <details>
              <summary>Constraints and assumptions</summary>
              <ul>
                {solution.constraints.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
          )}
          {!!solution.alternatives.length && (
            <details>
              <summary>Approaches and trade-offs</summary>
              <ul>
                {solution.alternatives.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </details>
          )}
          {!!solution.unknowns.length && (
            <details>
              <summary>What still needs deciding</summary>
              <ul>
                {solution.unknowns.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </details>
          )}
          <section>
            <h3>A practical next step</h3>
            <p>{solution.nextStep}</p>
          </section>
          <div className="solution-detail-actions">
            <Link className="button" to={discuss}>
              Discuss in Chat
            </Link>
            <button
              className="button"
              disabled={busy || archived}
              onClick={help}
            >
              Explore professional help
            </button>
            <button className="text-link" disabled={busy} onClick={download}>
              Download reasoning
            </button>
          </div>
          {!archived && (
            <label className="solution-decision">
              Reconsider this solution
              <select
                disabled={busy}
                value={
                  solution.decision === "rejected" ||
                  solution.decision === "deferred"
                    ? solution.decision
                    : "exploring"
                }
                onChange={(e) => {
                  const decision = e.target.value as
                    | "exploring"
                    | "deferred"
                    | "rejected";
                  void save({
                    ...state,
                    edits: {
                      ...state.edits,
                      [solution.id]: { ...state.edits[solution.id], decision },
                    },
                    selections: {
                      ...state.selections,
                      [solution.id]: {
                        selected: false,
                        basisRevision: solution.revision,
                        updatedAt: new Date().toISOString(),
                      },
                    },
                  });
                }}
              >
                <option value="exploring">Open for consideration</option>
                <option value="deferred">Defer for later</option>
                <option value="rejected">Set aside</option>
              </select>
            </label>
          )}
        </>
      )}
    </>
  );
}
