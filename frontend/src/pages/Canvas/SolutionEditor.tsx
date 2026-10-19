import { useState } from "react";
import type { Session, CanvasState } from "../../../../shared/src/index";
import type { Solution } from "../../../../shared/src/solutions";
export function SolutionEditor({
  solution,
  session,
  state,
  busy,
  save,
  correct,
  onDirty,
}: {
  solution: Solution;
  session: Session;
  state: CanvasState;
  busy: boolean;
  save: (state: CanvasState) => Promise<boolean>;
  correct: (key: string, value: string) => Promise<boolean>;
  onDirty?: (dirty: boolean) => void;
}) {
  const [title, setTitle] = useState(solution.title),
    [notes, setNotes] = useState(solution.objective ?? solution.description);
  const [source, setSource] = useState(""),
    [value, setValue] = useState("");
  const [priorities, setPriorities] = useState<Record<string, string>>({});
  const [capabilities, setCapabilities] = useState(
      state.edits[solution.id]?.capabilities ?? [],
    ),
    [newCapability, setNewCapability] = useState("");
  const [saved, setSaved] = useState(false);
  const facts = [
    ...new Map(
      solution.facts
        .filter((f) =>
          session.answers.some(
            (a) => a.questionId === f.sourceKey && typeof a.value === "string",
          ),
        )
        .map((f) => [f.sourceKey, f]),
    ).values(),
  ];
  return (
    <div className="solution-editor" onChange={() => onDirty?.(true)}>
      <p>
        Your refinements are recorded separately from kailor’s proposal.
        Material changes keep your selection and ask you to review it. Earlier
        reports stay unchanged.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const edits = {
            ...state.edits,
            [solution.id]: {
              ...state.edits[solution.id],
              title: title.trim(),
              notes: notes.trim(),
              capabilities:
                newCapability.trim().length >= 2 &&
                !capabilities.some(
                  (c) =>
                    c.label.toLowerCase() ===
                    newCapability.trim().toLowerCase(),
                ) &&
                !solution.requirements.some(
                  (r) =>
                    r.label.toLowerCase() ===
                    newCapability.trim().toLowerCase(),
                )
                  ? [
                      ...capabilities,
                      {
                        id: crypto.randomUUID(),
                        label: newCapability.trim(),
                        priority: "unconfirmed" as const,
                      },
                    ]
                  : capabilities,
            },
          };
          for (const r of solution.requirements)
            if (priorities[r.id])
              edits[r.id] = {
                ...edits[r.id],
                priority: priorities[r.id] as
                  | "essential"
                  | "optional"
                  | "deferred"
                  | "unconfirmed",
              };
          const success = await save({ ...state, edits });
          setSaved(success);
          if (success) {
            setNewCapability("");
            setCapabilities(edits[solution.id].capabilities ?? []);
            onDirty?.(false);
          }
        }}
      >
        <label>
          Solution title
          <input
            required
            minLength={2}
            maxLength={100}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
              onDirty?.(true);
            }}
          />
        </label>
        <label>
          Objective, capabilities and constraints
          <textarea
            required
            minLength={2}
            maxLength={1200}
            rows={4}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
              onDirty?.(true);
            }}
          />
        </label>
        {solution.requirements.length > 0 && (
          <fieldset>
            <legend>First-phase priorities</legend>
            {solution.requirements
              .filter((r) => !r.id.startsWith("requirement-user-"))
              .map((r) => (
                <label key={r.id} className="solution-priority">
                  {r.label}
                  <select
                    value={priorities[r.id] ?? r.priority}
                    onChange={(e) => {
                      setPriorities({ ...priorities, [r.id]: e.target.value });
                      setSaved(false);
                      onDirty?.(true);
                    }}
                  >
                    <option value="essential">Essential</option>
                    <option value="optional">Optional</option>
                    <option value="deferred">Deferred</option>
                    <option value="unconfirmed">Needs confirmation</option>
                  </select>
                </label>
              ))}
          </fieldset>
        )}
        <fieldset>
          <legend>Your additional capabilities</legend>
          <p>
            Record what you want included. These are your requirements, pending
            feasibility review. Defer existing capabilities above to remove them
            from the first phase.
          </p>
          {capabilities.map((c) => (
            <div className="solution-custom-capability" key={c.id}>
              <span>{c.label}</span>
              <select
                aria-label={`Priority for ${c.label}`}
                value={c.priority}
                onChange={(e) => {
                  setCapabilities(
                    capabilities.map((item) =>
                      item.id === c.id
                        ? {
                            ...item,
                            priority: e.target.value as typeof c.priority,
                          }
                        : item,
                    ),
                  );
                  setSaved(false);
                  onDirty?.(true);
                }}
              >
                <option value="essential">Essential</option>
                <option value="optional">Optional</option>
                <option value="deferred">Deferred</option>
                <option value="unconfirmed">Needs confirmation</option>
              </select>
              <button
                className="text-link"
                type="button"
                onClick={() => {
                  setCapabilities(
                    capabilities.filter((item) => item.id !== c.id),
                  );
                  setSaved(false);
                  onDirty?.(true);
                }}
              >
                Remove<span className="sr-only"> {c.label}</span>
              </button>
            </div>
          ))}
          <label>
            Add a capability
            <input
              maxLength={150}
              value={newCapability}
              onChange={(e) => setNewCapability(e.target.value)}
            />
          </label>
          <button
            className="button"
            type="button"
            disabled={
              newCapability.trim().length < 2 ||
              capabilities.length >= 30 ||
              busy
            }
            onClick={() => {
              const label = newCapability.trim();
              if (
                !capabilities.some(
                  (c) => c.label.toLowerCase() === label.toLowerCase(),
                ) &&
                !solution.requirements.some(
                  (r) => r.label.toLowerCase() === label.toLowerCase(),
                )
              )
                setCapabilities([
                  ...capabilities,
                  { id: crypto.randomUUID(), label, priority: "unconfirmed" },
                ]);
              setNewCapability("");
              setSaved(false);
              onDirty?.(true);
            }}
          >
            Add to scope
          </button>
        </fieldset>
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save refinements"}
        </button>
        {saved && (
          <p role="status">
            Refinements saved. Review the updated solution before proceeding.
          </p>
        )}
      </form>
      {!!facts.length && (
        <details>
          <summary>Correct the information behind this solution</summary>
          <p>
            These are your current guided answers. Saving replaces the selected
            answer and re-evaluates current guidance.
          </p>
          <label>
            Information to correct
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setValue(
                  String(
                    session.answers.find((a) => a.questionId === e.target.value)
                      ?.value ?? "",
                  ),
                );
              }}
            >
              <option value="">Choose a fact</option>
              {facts.map((f) => (
                <option key={f.sourceKey} value={f.sourceKey}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          {source && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await correct(source, value)) setSource("");
              }}
            >
              <label>
                Corrected information
                <textarea
                  required
                  minLength={2}
                  maxLength={1200}
                  rows={4}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              <button className="button" disabled={busy}>
                Save fact correction and re-evaluate
              </button>
            </form>
          )}
        </details>
      )}
    </div>
  );
}
