import "./PlanLanding.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { api, sessionHref } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";
import type { PlanItem, PlansResponse } from "../../../../shared/src/index";

import { PlanManager } from "../../components/PlanManager/PlanManager";
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
