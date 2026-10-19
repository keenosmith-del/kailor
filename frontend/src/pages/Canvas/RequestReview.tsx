import { solutionStatus } from "../../../../shared/src/solutions";
import { useState } from "react";
import { Link } from "react-router";
import type { Solution } from "../../../../shared/src/solutions";
import { api, sessionHref } from "../../services/api";
export function RequestReview({
  solutions,
  planId,
  sessionId,
  projectRevision,
  busy,
  change,
  onBusy,
  onSubmitted,
  unresolved = false,
}: {
  solutions: Solution[];
  planId: string;
  sessionId: string;
  projectRevision: number;
  busy: boolean;
  change: (solution: Solution) => void;
  onBusy: (busy: boolean) => void;
  onSubmitted: () => Promise<void>;
  unresolved?: boolean;
}) {
  const key = `kailor:consultancy-draft:${planId}`;
  const [draft, setDraft] = useState<{ notes: string; requestKey: string }>(
    () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
        if (
          saved &&
          typeof saved.notes === "string" &&
          typeof saved.requestKey === "string"
        )
          return saved;
      } catch {
        /* Storage is optional; project selections are server-owned. */
      }
      return { notes: "", requestKey: crypto.randomUUID() };
    },
  );
  const [error, setError] = useState(""),
    [receipt, setReceipt] = useState<{ id: string; status: string } | null>(
      null,
    );
  const guest = window.location.pathname.startsWith("/preview/");
  const needsReview = solutions.some((s) => s.reviewRequired);
  function update(notes: string) {
    const next = { ...draft, notes };
    setDraft(next);
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }
  async function submit() {
    onBusy(true);
    setError("");
    try {
      const result = await api<{ id: string; status: string }>(
        `/plans/${planId}/consultancy-requests`,
        "POST",
        {
          sessionId,
          projectRevision,
          requestKey: draft.requestKey,
          notes: draft.notes,
          solutions: solutions.map((s) => ({ id: s.id, revision: s.revision })),
        },
      );
      setReceipt(result);
      await onSubmitted();
      try {
        sessionStorage.removeItem(key);
      } catch {}
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not submit. Your draft is retained.",
      );
    } finally {
      onBusy(false);
    }
  }
  if (receipt)
    return (
      <div role="status">
        <h3>Request received</h3>
        <p>
          Your request is {receipt.status}. The platform owner can retrieve the
          submitted scope for review. No work has been commissioned.
        </p>
        <p className="fine-print">Reference: {receipt.id}</p>
      </div>
    );
  return (
    <>
      <ul className="solution-review-list">
        {solutions.map((s) => (
          <li key={s.id}>
            <div>
              <strong>{s.title}</strong>
              <p>{s.description}</p>
              <small>{solutionStatus(s)} · Current saved scope</small>
              <details>
                <summary>Review included scope</summary>
                <ul>
                  {s.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {s.requirements.map((r) => (
                    <li key={r.id}>
                      {r.label} ·{" "}
                      {r.priority === "unconfirmed"
                        ? "needs confirmation"
                        : r.priority}
                    </li>
                  ))}
                </ul>
                {s.constraints.length > 0 && (
                  <>
                    <p>Recorded constraints</p>
                    <ul>
                      {s.constraints.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
              </details>
            </div>
            <button
              className="text-link"
              disabled={busy}
              onClick={() => change(s)}
            >
              Remove<span className="sr-only"> {s.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {!solutions.length && (
        <p>No solutions selected. Close this review to explore your options.</p>
      )}
      {solutions.some((s) => s.request) && (
        <p>
          A previous request already includes one or more of these solutions.
          Its submitted scope stays unchanged if you send another request.
        </p>
      )}
      {unresolved && (
        <p className="solution-notice">
          Close this review and reconcile the previous selections that are no
          longer recommended.
        </p>
      )}
      {needsReview && (
        <p className="solution-notice">
          Open the changed solutions and confirm their updated scope before
          submitting.
        </p>
      )}
      <label>
        Objectives, scope assumptions and notes
        <textarea
          maxLength={3000}
          rows={4}
          value={draft.notes}
          onChange={(e) => update(e.target.value)}
          placeholder="What would you like professional help with?"
        />
      </label>
      <p>
        We’ll preserve each solution, its capabilities, recorded constraints and
        current revision together in one request. A request starts a scope
        discussion; quotations, booking and engagement approval are not yet
        available.
      </p>
      {guest ? (
        <div className="solution-notice">
          <p>
            Guest selections follow this session’s retention limits. Keep this
            project in an account before submitting. Your notes remain in this
            tab.
          </p>
          <Link
            className="button"
            to={`${sessionHref(sessionId, "account")}?resume=consultancy`}
          >
            Sign in and keep this project
          </Link>
        </div>
      ) : (
        <button
          className="button"
          disabled={busy || !solutions.length || needsReview || unresolved}
          onClick={() => void submit()}
        >
          {busy ? "Submitting…" : "Request professional help"}
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error} Your selections and notes are retained.
        </p>
      )}
    </>
  );
}
