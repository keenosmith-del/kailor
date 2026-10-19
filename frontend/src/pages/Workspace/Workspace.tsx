import { ConsultancyInbox } from "./components/ConsultancyInbox/ConsultancyInbox";
import "./Workspace.css";
import { PlanManager } from "../../components/PlanManager/PlanManager";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { clearDrafts } from "../../utils/drafts";
import { api } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";
import { CaseReview, type CaseItem } from "./components/CaseReview/CaseReview";
import { InviteForm } from "./components/InviteForm/InviteForm";
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
      {founder && <ConsultancyInbox />}
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
