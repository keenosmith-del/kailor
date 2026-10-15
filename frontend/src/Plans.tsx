import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api, sessionHref } from "./api";
import { ErrorBox, errorMessage } from "./ui";
import type {
  PlanItem,
  PlansResponse,
  PlanUnderstanding,
  Preference,
  Report,
} from "../../shared/src/index";

const knowledgeLabels: Record<string, string> = {
  goals: "Objectives",
  request: "Requested scope",
  presence: "Current channels",
  tools: "Tools and workflow",
  constraints: "Constraints",
  budget: "Budget",
  timing: "Timing",
  websiteStatus: "Current website",
  appPreference: "Application preference",
  websitePreference: "Website preference",
  industry: "Activity",
  stage: "Starting point",
  kind: "Project type",
  problems: "Challenges",
};
const fieldLabel = (key: string) =>
  knowledgeLabels[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2");
const fieldValue = (value: unknown) =>
  Array.isArray(value)
    ? value.join(", ")
    : value === "requested"
      ? "Wanted for this plan"
      : value === "declined"
        ? "Not currently wanted"
        : value === "absent"
          ? "None currently"
          : value === "existing"
            ? "Already in place"
            : String(value);
export function PlanNavigation({
  sessionId,
  planId,
  title,
  busy = false,
  onChange,
}: {
  sessionId?: string;
  planId?: string;
  title?: string;
  busy?: boolean;
  onChange?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <div className="plan-navigation">
      <span>{title ?? "Your plans"}</span>
      <button
        className="text-link"
        disabled={busy}
        onClick={() => setOpen((x) => !x)}
      >
        {open ? "Close plans" : "Change plan"}
      </button>
      <dialog
        ref={dialog}
        className="plan-dialog"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <button className="text-link" onClick={() => setOpen(false)}>
          Close plans
        </button>
        {open && (
          <PlanManager
            currentPlanId={planId}
            currentSessionId={sessionId}
            onNavigated={() => {
              setOpen(false);
              onChange?.();
            }}
          />
        )}
      </dialog>
    </div>
  );
}
export function PlanManager({
  currentPlanId,
  currentSessionId,
  onNavigated,
}: {
  currentPlanId?: string;
  currentSessionId?: string;
  onNavigated?: () => void;
} = {}) {
  const navigate = useNavigate();
  const [data, setData] = useState<PlansResponse | null>(null),
    [archived, setArchived] = useState(false),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [comparison, setComparison] = useState<{
      scope: string;
      plans: {
        planId: string;
        title: string;
        confirmed: { key: string; value: unknown }[];
        unknowns: string[];
      }[];
    } | null>(null),
    [summary, setSummary] = useState<PlanUnderstanding | null>(null),
    [prefs, setPrefs] = useState<Preference[]>([]),
    [reports, setReports] = useState<
      {
        id: string;
        createdAt: string;
        assessment: { summary: string; sessionId: string };
      }[]
    >([]),
    [historic, setHistoric] = useState<Report | null>(null),
    [nextReports, setNextReports] = useState<string | null>(null);
  const key = useRef(crypto.randomUUID()),
    pending = useRef(false),
    discoveryKey = useRef(crypto.randomUUID());
  const [rename, setRename] = useState<Record<string, string>>({});
  const listSequence = useRef(0);
  const [sessionCursors, setSessionCursors] = useState<
    Record<string, string | null>
  >({});
  async function load(more = false) {
    const sequence = ++listSequence.current;
    const response = await api<PlansResponse>(
      `/plans?archived=${archived}${more && data?.nextCursor ? `&cursor=${data.nextCursor}` : ""}`,
    );
    if (sequence !== listSequence.current) return;
    setData((previous) =>
      more && previous
        ? { ...response, plans: [...previous.plans, ...response.plans] }
        : response,
    );
  }
  useEffect(() => {
    setData(null);
    void load().catch((e) => setError(errorMessage(e)));
    void api<Preference[]>("/preferences")
      .then(setPrefs)
      .catch((e) => setError(errorMessage(e)));
  }, [archived]);
  async function action(fn: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
      await load().catch(() => {});
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function open(p: PlanItem, sessionId?: string) {
    const result = await api<{ sessionId: string }>(
      `/plans/${p.id}/select`,
      "POST",
      {
        revision: data?.selection.revision ?? 0,
        ...(sessionId ? { sessionId } : {}),
      },
    );
    navigate(sessionHref(result.sessionId, "conversation"));
    onNavigated?.();
    await load();
  }
  async function savePreference(key: string, value: string | null) {
    setPrefs(
      await api<Preference[]>("/preferences", "PUT", {
        key,
        value,
        revision: prefs.find((p) => p.key === key)?.revision ?? 0,
      }),
    );
  }
  return (
    <section className="plan-manager" aria-label="Plan management">
      <h2>Make room for each idea.</h2>
      <p className="muted">
        Each plan keeps its own conversation, evidence and assessments.
      </p>
      <ErrorBox error={error} />
      {!currentPlanId && data?.selection.activePlanId && (
        <button
          className="button"
          disabled={busy}
          onClick={() =>
            void action(async () => {
              const p =
                data.plans.find((p) => p.id === data.selection.activePlanId) ??
                (await api<PlanItem>(`/plans/${data.selection.activePlanId}`));
              await open(p);
            })
          }
        >
          Resume previous plan
        </button>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action(async () => {
            const p = await api<PlanItem>("/plans", "POST", {
              title,
              description,
              creationKey: key.current,
            });
            key.current = crypto.randomUUID();
            setTitle("");
            setDescription("");
            await open(p);
          });
        }}
      >
        <label>
          New plan name
          <input
            value={title}
            required
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Business, project or idea"
          />
        </label>
        <label>
          Description <span className="muted">(optional)</span>
          <textarea
            value={description}
            maxLength={1000}
            rows={2}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button className="button" disabled={busy}>
          Create another plan
        </button>
      </form>
      <button
        className="text-link"
        disabled={busy}
        onClick={() => {
          setArchived((a) => !a);
          setSelected([]);
          setComparison(null);
          setSummary(null);
        }}
      >
        {archived ? "Show active plans" : "Show archived plans"}
      </button>
      {data?.plans.map((p) => (
        <article key={p.id} className="plan-row">
          <div className="actions">
            <Link
              to={`${window.location.pathname.startsWith("/preview/") ? "/preview" : ""}/plans/${p.id}`}
            >
              {p.title}
            </Link>
            {p.id === currentPlanId && (
              <span className="muted">Current plan</span>
            )}
            {!p.archivedAt && (
              <button
                className="button"
                disabled={busy}
                onClick={() => void action(() => open(p))}
              >
                Open plan
              </button>
            )}
          </div>
          {p.description && <p>{p.description}</p>}
          <details>
            <summary>Plan options</summary>
            <label>
              Rename {p.title}
              <input
                maxLength={150}
                value={rename[p.id] ?? p.title}
                onChange={(e) =>
                  setRename((previous) => ({
                    ...previous,
                    [p.id]: e.target.value,
                  }))
                }
              />
            </label>
            <div className="actions">
              <button
                className="text-link"
                disabled={busy || !(rename[p.id] ?? p.title).trim()}
                onClick={() =>
                  void action(async () => {
                    await api(`/plans/${p.id}`, "PATCH", {
                      revision: p.revision,
                      title: rename[p.id] ?? p.title,
                    });
                    await load();
                    onNavigated?.();
                  })
                }
              >
                Save name
              </button>
              <button
                className="text-link"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    await api(`/plans/${p.id}`, "PATCH", {
                      revision: p.revision,
                      archived: !p.archivedAt,
                    });
                    await load();
                    onNavigated?.();
                  })
                }
              >
                {p.archivedAt ? "Restore plan" : "Archive plan"}
              </button>
              <button
                className="text-link"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    setSummary(
                      await api<PlanUnderstanding>(
                        `/plans/${p.id}/understanding${p.id === currentPlanId && currentSessionId ? `?sessionId=${currentSessionId}` : ""}`,
                      ),
                    );
                    setHistoric(null);
                    const r = await api<{
                      reports: typeof reports;
                      nextCursor: string | null;
                    }>(`/plans/${p.id}/reports`);
                    setReports(r.reports);
                    setNextReports(r.nextCursor);
                  })
                }
              >
                What kailor knows
              </button>
              {!p.archivedAt && (
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      const result = await api<{ sessionId: string }>(
                        `/plans/${p.id}/sessions`,
                        "POST",
                        {
                          revision: p.revision,
                          creationKey: discoveryKey.current,
                        },
                      );
                      discoveryKey.current = crypto.randomUUID();
                      await open(p, result.sessionId);
                    })
                  }
                >
                  Start a new discovery in this plan
                </button>
              )}
            </div>
            {!p.archivedAt && (
              <details>
                <summary>
                  Previous discoveries (
                  {p._count?.sessions ?? p.sessions?.length ?? 0})
                </summary>
                {p.sessions?.map((s) => (
                  <button
                    key={s.id}
                    className="text-link"
                    disabled={busy}
                    onClick={() => void action(() => open(p, s.id))}
                  >
                    {new Date(s.updatedAt).toLocaleString()} ·{" "}
                    {s.id === currentSessionId
                      ? "Current discovery"
                      : "Saved discovery"}
                  </button>
                ))}
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      const page = await api<{
                        sessions: PlanItem["sessions"];
                        nextCursor: string | null;
                      }>(
                        `/plans/${p.id}/sessions${sessionCursors[p.id] ? `?cursor=${sessionCursors[p.id]}` : ""}`,
                      );
                      setSessionCursors((old) => ({
                        ...old,
                        [p.id]: page.nextCursor,
                      }));
                      setData((old) =>
                        old
                          ? {
                              ...old,
                              plans: old.plans.map((item) =>
                                item.id === p.id
                                  ? {
                                      ...item,
                                      sessions: [
                                        ...new Map(
                                          [
                                            ...(item.sessions ?? []),
                                            ...page.sessions,
                                          ].map((s) => [s.id, s]),
                                        ).values(),
                                      ],
                                    }
                                  : item,
                              ),
                            }
                          : old,
                      );
                    })
                  }
                >
                  Load earlier discoveries
                </button>
              </details>
            )}
          </details>
          <label className="plan-compare-choice">
            <input
              type="checkbox"
              disabled={
                busy || (!selected.includes(p.id) && selected.length === 2)
              }
              checked={selected.includes(p.id)}
              onChange={() =>
                setSelected((ids) =>
                  ids.includes(p.id)
                    ? ids.filter((id) => id !== p.id)
                    : [...ids, p.id],
                )
              }
            />{" "}
            Include in comparison
          </label>
        </article>
      ))}
      {!data && <p role="status">Loading plans…</p>}
      {data && !data.plans.length && (
        <p className="muted">
          No {archived ? "archived" : "active"} plans here yet.
        </p>
      )}
      {data?.nextCursor && (
        <button
          className="text-link"
          disabled={busy}
          onClick={() => void action(() => load(true))}
        >
          More plans
        </button>
      )}
      {selected.length === 2 && (
        <button
          className="button"
          disabled={busy}
          onClick={() =>
            void action(async () =>
              setComparison(
                await api("/plans/compare", "POST", { planIds: selected }),
              ),
            )
          }
        >
          Compare selected plans
        </button>
      )}
      {comparison && (
        <div className="plan-comparison">
          <p>{comparison.scope}</p>
          {comparison.plans.map((p) => (
            <section key={p.planId}>
              <h3>{p.title}</h3>
              {p.confirmed.map((f) => (
                <p key={f.key}>
                  <strong>{fieldLabel(f.key)}:</strong> {fieldValue(f.value)}
                </p>
              ))}
              <p className="muted">
                Still unknown:{" "}
                {p.unknowns.join("; ") || "No recorded optional gaps"}
              </p>
            </section>
          ))}
        </div>
      )}
      {summary && (
        <section className="plan-understanding">
          <h3>Understanding {summary.plan.title}</h3>
          <p className="muted">Confirmed knowledge in the selected discovery</p>
          {summary.confirmed.map((f) => (
            <p key={f.key}>
              <strong>{fieldLabel(f.key)}:</strong> {fieldValue(f.value)}
            </p>
          ))}
          <p>
            {summary.pending.length} details await confirmation.{" "}
            {summary.readiness.canAssess
              ? "An initial assessment can be prepared."
              : "More information is needed."}
          </p>
          <p className="muted">Unknown: {summary.unknowns.join("; ")}</p>
          {summary.summary && (
            <details>
              <summary>Earlier discussion · unconfirmed memory</summary>
              {summary.summary.entries.map((e) => (
                <p key={e.sourceMessageId}>{e.text}</p>
              ))}
            </details>
          )}
          <h3>Saved report history</h3>
          {reports.map((r) => (
            <button
              className="text-link"
              disabled={busy}
              key={r.id}
              onClick={() =>
                void action(async () =>
                  setHistoric(
                    (
                      await api<{ content: Report }>(
                        `/plans/${summary.plan.id}/reports/${r.id}`,
                      )
                    ).content,
                  ),
                )
              }
            >
              {new Date(r.createdAt).toLocaleString()} · {r.assessment.summary}
            </button>
          ))}
          {nextReports && (
            <button
              className="text-link"
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  const more = await api<{
                    reports: typeof reports;
                    nextCursor: string | null;
                  }>(`/plans/${summary.plan.id}/reports?cursor=${nextReports}`);
                  setReports((old) => [...old, ...more.reports]);
                  setNextReports(more.nextCursor);
                })
              }
            >
              More saved reports
            </button>
          )}
          {historic && (
            <details open>
              <summary>{historic.title} · historical snapshot</summary>
              {historic.sections.map((s) => (
                <section key={s.title}>
                  <h4>{s.title}</h4>
                  {s.paragraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </details>
          )}
        </section>
      )}
      <details className="account-preferences">
        <summary>Account-wide preferences</summary>
        <p>
          Save a reusable default explicitly. Current plan requirements always
          take priority; budgets and timelines stay in each plan.
        </p>
        <label>
          Explanation style
          <select
            disabled={busy}
            value={
              prefs.find((p) => p.key === "communicationStyle")?.value ?? ""
            }
            onChange={(e) =>
              void action(() =>
                savePreference("communicationStyle", e.target.value || null),
              )
            }
          >
            <option value="">No saved default</option>
            <option value="plain-language">Plain language across plans</option>
            <option value="technical-detail">
              Technical detail across plans
            </option>
          </select>
        </label>
        <label>
          Implementation default
          <select
            disabled={busy}
            value={
              prefs.find((p) => p.key === "implementationPreference")?.value ??
              ""
            }
            onChange={(e) =>
              void action(() =>
                savePreference(
                  "implementationPreference",
                  e.target.value || null,
                ),
              )
            }
          >
            <option value="">No saved default</option>
            <option value="existing-tools-first">
              Explore existing tools first across plans
            </option>
            <option value="custom-when-justified">
              Consider custom work when justified
            </option>
          </select>
        </label>
      </details>
    </section>
  );
}

export function PlanLanding() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [archived, setArchived] = useState(false);
  useEffect(() => {
    let current = true;
    void (async () => {
      try {
        const plan = await api<PlanItem>(`/plans/${planId}`);
        if (!current) return;
        if (plan.archivedAt) {
          setArchived(true);
          return;
        }
        const data = await api<PlansResponse>("/plans");
        if (!current) return;
        const selected = await api<{ sessionId: string }>(
          `/plans/${planId}/select`,
          "POST",
          { revision: data.selection.revision },
        );
        if (current)
          navigate(sessionHref(selected.sessionId, "conversation"), {
            replace: true,
          });
      } catch (e) {
        if (current) setError(errorMessage(e));
      }
    })();
    return () => {
      current = false;
    };
  }, [planId]);
  return (
    <main className="session-shell">
      <ErrorBox error={error} />
      {archived ? (
        <>
          <p>This plan is archived. Restore it to continue.</p>
          <PlanManager currentPlanId={planId} />
        </>
      ) : error ? (
        <PlanManager />
      ) : (
        <p role="status">Opening your plan…</p>
      )}
    </main>
  );
}
