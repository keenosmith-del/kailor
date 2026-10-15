import { PlanManager } from "./Plans";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { services } from "../../data/services";
import { clearDrafts } from "./drafts";
import type { Report } from "../../shared/src/index";
import { api } from "./api";
import { ErrorBox, errorMessage } from "./ui";
export function Workspace({ founder = false }: { founder?: boolean }) {
  const [personas, setPersonas] = useState<{ id: string; name: string }[]>([]),
    [cases, setCases] = useState<CaseItem[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const load = useCallback(async () => {
    if (!founder) return;
    try {
      const [p, c] = await Promise.all([
        api<typeof personas>("/personas"),
        api<CaseItem[]>("/cases"),
      ]);
      setPersonas(p);
      setCases(c);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [founder]);
  useEffect(() => {
    void load();
  }, [load]);
  async function simulate(id: string) {
    setBusy(true);
    setError("");
    try {
      const run = await api<{
        sessionId: string;
        passed: boolean;
        report: unknown;
        failure?: { message: string };
      }>("/simulations", "POST", {
        personaId: id,
      });
      if (!run.passed || !run.report) {
        setError(
          run.failure?.message ??
            "This synthetic run needs clarification. Its discovery has been saved; no reusable case was created.",
        );
        await load();
      } else navigate(`/sessions/${run.sessionId}/discovery`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={`workspace ${founder ? "" : "personal-workspace"}`}>
      <nav className="session-navigation" aria-label="Private workspace">
        <Link className="home-link" to="/">
          kailor
        </Link>
        <button
          className="text-link"
          onClick={() =>
            void api("/auth/logout", "POST").then(
              () => (clearDrafts(), window.location.assign("/workspace")),
            )
          }
        >
          Sign out
        </button>
      </nav>

      <h1>Your workspace</h1>
      <ErrorBox error={error} />
      {founder && <InviteForm />}
      <div className="workspace-grid">
        <PlanManager />
        {founder && (
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
        )}
      </div>
      {founder && (
        <section className="review-section">
          <h2>Reference knowledge review</h2>
          <p className="muted">
            Sanitize the reusable pattern before approval. Source classification
            is preserved.
          </p>
          {cases
            .filter((c) => c.sourceType !== "seed")
            .map((c) => (
              <CaseReview
                key={`${c.id}:${c.reviewVersion ?? 0}`}
                item={c}
                related={cases}
                onSaved={load}
              />
            ))}
          {!cases.some((c) => c.sourceType !== "seed") && (
            <p className="muted">
              Run a synthetic persona to create a pending reference.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
type Approach = {
  serviceId: string;
  title: string;
  rationale: string;
  dependencies?: string[];
  unsuitableWhen?: string[];
};
type CaseItem = {
  id: string;
  title: string;
  sourceType: string;
  reviewStatus: string;
  reviewVersion?: number;
  reviewNotes?: string;
  sourceRunId?: string;
  pattern: {
    industry: string;
    problems: string[];
    tools: string[];
    goals: string[];
    patterns: string[];
    approaches?: Approach[];
    [key: string]: unknown;
  };
};
type Run = {
  id: string;
  sessionId: string;
  discoveryPath: {
    questionId?: string;
    title?: string;
    value?: unknown;
    skipped?: boolean;
  }[];
  evaluationNotes: string;
  persona: { description?: string };
};
function CaseReview({
  item,
  related,
  onSaved,
}: {
  item: CaseItem;
  related: CaseItem[];
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title),
    [pattern, setPattern] = useState(item.pattern),
    [notes, setNotes] = useState(item.reviewNotes ?? ""),
    [omissions, setOmissions] = useState(""),
    [assumptions, setAssumptions] = useState(""),
    [verdict, setVerdict] = useState("needs_revision"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [run, setRun] = useState<Run | null>(null),
    [report, setReport] = useState<Report | null>(null),
    [comparison, setComparison] = useState(""),
    [otherReport, setOtherReport] = useState<Report | null>(null);
  const lines = (text: string) =>
    text
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  async function source() {
    if (run || !item.sourceRunId) return;
    try {
      const found = await api<Run & { report: Report | null }>(
        `/simulations/${item.sourceRunId}`,
      );
      setRun(found);
      setReport(found.report);
      try {
        const review = JSON.parse(found.evaluationNotes).review;
        if (review) {
          setAssumptions((review.incorrectAssumptions ?? []).join("\n"));
          setOmissions((review.omissions ?? []).join("\n"));
          setVerdict(review.verdict);
        }
      } catch {
        /* Earlier evaluation notes can be plain text. */
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function compare(id: string) {
    setComparison(id);
    setOtherReport(null);
    const other = related.find((c) => c.id === id);
    if (!other?.sourceRunId) return;
    try {
      const found = await api<Run & { report: Report | null }>(
        `/simulations/${other.sourceRunId}`,
      );
      setOtherReport(found.report);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function review(status: string) {
    setBusy(true);
    setError("");
    try {
      if (item.sourceRunId)
        await api(`/simulations/${item.sourceRunId}/evaluation`, "PUT", {
          notes,
          omissions: lines(omissions),
          incorrectAssumptions: lines(assumptions),
          verdict,
        });
      await api(`/cases/${item.id}/review`, "PUT", {
        status,
        title,
        pattern,
        notes,
        reviewVersion: item.reviewVersion ?? 0,
      });
      await onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const fields = [
    ["problems", "Relevant problems (one matching factor per line)"],
    ["tools", "Relevant tools and channels"],
    ["goals", "Relevant objectives"],
    ["scope", "Scope matching factors"],
    ["discoveryQuestions", "Useful follow-up questions"],
    ["limitations", "Known limitations and unverified outcomes"],
    ["unsuitableConditions", "Conditions requiring a different approach"],
    ["unsuitableConstraints", "Constraint terms that exclude this reference"],
  ];
  return (
    <details
      className="case-review"
      onToggle={(e) => {
        if (e.currentTarget.open) void source();
      }}
    >
      <summary>
        {item.title}
        <span className="badge">
          {item.sourceType} · {item.reviewStatus} · version{" "}
          {item.reviewVersion ?? 0} · outcome unverified
        </span>
      </summary>
      {run && (
        <>
          <p>{run.persona.description}</p>
          <Link className="text-link" to={`/sessions/${run.sessionId}/report`}>
            Open source assessment
          </Link>
          <details>
            <summary>Discovery path</summary>
            <ol>
              {run.discoveryPath.map((p, i) => (
                <li key={i}>
                  {p.title ?? p.questionId}:{" "}
                  {p.skipped
                    ? "Skipped deliberately"
                    : typeof p.value === "string"
                      ? p.value
                      : JSON.stringify(p.value)}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      {report && (
        <details>
          <summary>Assessment findings</summary>
          {report.recommendations.map((r, i) => (
            <div key={i}>
              <h3>{r.solution}</h3>
              <p>{r.problem}</p>
              <p>{r.evidence.join("; ")}</p>
              <p>{r.alternatives.join("; ")}</p>
            </div>
          ))}
        </details>
      )}
      <label>
        Compare another related synthetic case
        <select
          value={comparison}
          onChange={(e) => void compare(e.target.value)}
        >
          <option value="">Choose a case</option>
          {related
            .filter((c) => c.id !== item.id && c.sourceRunId)
            .map((c) => (
              <option value={c.id} key={c.id}>
                {c.title}
              </option>
            ))}
        </select>
      </label>
      {otherReport && (
        <p>
          {otherReport.recommendations
            .map((r) => `${r.solution}: ${r.problem}`)
            .join(" ")}
        </p>
      )}
      <label>
        Reusable title
        <input
          maxLength={150}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        Context or activity
        <input
          value={pattern.industry}
          onChange={(e) => setPattern({ ...pattern, industry: e.target.value })}
        />
      </label>
      {fields.map(([key, label]) => (
        <label key={key}>
          {label}
          <textarea
            rows={2}
            value={
              Array.isArray(pattern[key])
                ? (pattern[key] as string[]).join("\n")
                : ""
            }
            onChange={(e) =>
              setPattern({ ...pattern, [key]: lines(e.target.value) })
            }
          />
        </label>
      ))}
      <fieldset>
        <legend>Supported solution categories</legend>
        {services
          .filter(
            (s) =>
              !report ||
              report.recommendations.some((r) => r.serviceId === s.id),
          )
          .map((s) => (
            <label key={s.id}>
              <input
                type="checkbox"
                checked={pattern.patterns.includes(s.id)}
                onChange={(e) =>
                  setPattern({
                    ...pattern,
                    patterns: e.target.checked
                      ? [...pattern.patterns, s.id]
                      : pattern.patterns.filter((id) => id !== s.id),
                  })
                }
              />
              {s.name}
            </label>
          ))}
      </fieldset>
      <fieldset>
        <legend>Useful follow-up dimensions</legend>
        {Object.entries({
          offlineDetails: "Offline storage and synchronization",
          dataCaptureDetails: "Records and data capture",
          accessDetails: "Users and permissions",
          reportingDetails: "Reporting and record retention",
          integrationDetails: "Existing system integrations",
          bookingCapabilities: "Current booking provider capabilities",
          websiteContent: "Website content and maintenance",
          currentAlternatives: "Existing tools and simpler processes",
          firstVersion: "Smallest useful version",
        }).map(([id, label]) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={
                (pattern.followUpDimensions as string[] | undefined)?.includes(
                  id,
                ) ?? false
              }
              onChange={(e) => {
                const current =
                  (pattern.followUpDimensions as string[] | undefined) ?? [];
                setPattern({
                  ...pattern,
                  followUpDimensions: e.target.checked
                    ? [...current, id]
                    : current.filter((x) => x !== id),
                });
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <details>
        <summary>Reusable alternatives and dependencies</summary>
        {(pattern.approaches ?? []).map((a, i) => {
          const change = (patch: Partial<Approach>) =>
            setPattern({
              ...pattern,
              approaches: (pattern.approaches ?? []).map((x, n) =>
                n === i ? { ...x, ...patch } : x,
              ),
            });
          return (
            <div key={i}>
              <label>
                Supported service
                <select
                  value={a.serviceId}
                  onChange={(e) => change({ serviceId: e.target.value })}
                >
                  {pattern.patterns.map((id) => (
                    <option key={id} value={id}>
                      {services.find((s) => s.id === id)?.name ?? id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Approach
                <input
                  value={a.title}
                  onChange={(e) => change({ title: e.target.value })}
                />
              </label>
              <label>
                Why compare it?
                <textarea
                  value={a.rationale}
                  onChange={(e) => change({ rationale: e.target.value })}
                />
              </label>
              <label>
                Dependencies
                <textarea
                  value={(a.dependencies ?? []).join("\n")}
                  onChange={(e) =>
                    change({ dependencies: lines(e.target.value) })
                  }
                />
              </label>
              <label>
                Unsuitable when this fact is existing or preference declined
                <select
                  value={a.unsuitableWhen?.[0] ?? ""}
                  onChange={(e) =>
                    change({
                      unsuitableWhen: e.target.value ? [e.target.value] : [],
                    })
                  }
                >
                  <option value="">No condition</option>
                  {[
                    "websiteStatus",
                    "bookingStatus",
                    "aiPreference",
                    "automationPreference",
                    "websitePreference",
                    "appPreference",
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <button
                className="text-link"
                onClick={() =>
                  setPattern({
                    ...pattern,
                    approaches: pattern.approaches?.filter((_, n) => n !== i),
                  })
                }
              >
                Remove approach
              </button>
            </div>
          );
        })}
        <button
          className="text-link"
          disabled={
            !pattern.patterns.length || (pattern.approaches?.length ?? 0) >= 10
          }
          onClick={() =>
            setPattern({
              ...pattern,
              approaches: [
                ...(pattern.approaches ?? []),
                { serviceId: pattern.patterns[0], title: "", rationale: "" },
              ],
            })
          }
        >
          Add alternative
        </button>
      </details>
      <label>
        Incorrect assumptions
        <textarea
          value={assumptions}
          onChange={(e) => setAssumptions(e.target.value)}
        />
      </label>
      <label>
        Omissions
        <textarea
          value={omissions}
          onChange={(e) => setOmissions(e.target.value)}
        />
      </label>
      <label>
        Source assessment verdict
        <select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
          <option value="needs_revision">Needs revision</option>
          <option value="acceptable">Acceptable</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      <label>
        Review notes (required)
        <textarea
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Useful recommendations, corrections and removal of identifying information."
        />
      </label>
      <details>
        <summary>Technical inspection</summary>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {JSON.stringify(pattern, null, 2)}
        </pre>
      </details>
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

function InviteForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <details className="account-invites">
      <summary>Invite someone</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          setCode("");
          void api<{ invite: string }>("/auth/invites", "POST", {
            email: email.trim().toLowerCase(),
          })
            .then((r) => setCode(r.invite))
            .catch((e) => setError(errorMessage(e)))
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Email
          <input
            type="email"
            autoComplete="off"
            value={email}
            required
            onChange={(e) => {
              setEmail(e.target.value);
              setCode("");
            }}
          />
        </label>
        <button className="button" disabled={busy}>
          {busy ? "Creating…" : "Create invitation"}
        </button>
      </form>
      <ErrorBox error={error} />
      {code && (
        <p role="status">
          Share this invitation privately with {email}. It expires in seven days
          and can be used once: <code>{code}</code>
        </p>
      )}
    </details>
  );
}
