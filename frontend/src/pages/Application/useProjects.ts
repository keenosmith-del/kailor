import { useCallback, useEffect, useRef, useState } from "react";
import type { PlanItem, PlansResponse } from "../../../../shared/src/index";
import { api } from "../../services/api";
import { errorMessage } from "../../utils/errorMessage";

async function catalogue() {
  const result = await api<PlansResponse>("/plans");
  const active = result.selection.activePlanId;
  if (active && !result.plans.some((p) => p.id === active)) {
    const project = await api<PlanItem>(`/plans/${active}`);
    if (!project.archivedAt) result.plans.unshift({ ...project, sessions: [] });
  }
  return result;
}
export function useProjects(guest: boolean, owner: string, enabled = true) {
  const [data, setData] = useState<PlansResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const creationKey = useRef(crypto.randomUUID());
  const refresh = useCallback(async () => {
    const result = await catalogue();
    setData(result);
    return result;
  }, [guest, owner]);
  useEffect(() => {
    let live = true;
    if (!enabled) {
      setData(null);
      setError("");
      return;
    }
    setData(null);
    setError("");
    void catalogue()
      .then((result) => {
        if (live) setData(result);
      })
      .catch((e) => {
        if (live) setError(errorMessage(e));
      });
    return () => {
      live = false;
    };
  }, [guest, owner, enabled]);
  async function action<T>(fn: () => Promise<T>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(errorMessage(e));
      await refresh().catch(() => {});
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function select(project: PlanItem, sessionId?: string) {
    return action(async () => {
      const latest = await refresh();
      const selected = await api<{ sessionId: string }>(
        `/plans/${project.id}/select`,
        "POST",
        {
          revision: latest.selection.revision,
          ...(sessionId ? { sessionId } : {}),
        },
      );
      await refresh();
      return selected.sessionId;
    });
  }
  async function create(title: string) {
    return action(async () => {
      const project = await api<PlanItem>("/plans", "POST", {
        title,
        description: "",
        creationKey: creationKey.current,
      });
      const latest = await refresh();
      const result = await api<{ sessionId: string }>(
        `/plans/${project.id}/select`,
        "POST",
        { revision: latest.selection.revision },
      );
      await refresh();
      creationKey.current = crypto.randomUUID();
      return result.sessionId;
    });
  }
  async function rename(project: PlanItem, title: string) {
    return action(async () => {
      await api(`/plans/${project.id}`, "PATCH", {
        revision: project.revision,
        title,
      });
      await refresh();
    });
  }
  async function more() {
    if (!data?.nextCursor) return;
    return action(async () => {
      const result = await api<PlansResponse>(
        `/plans?cursor=${data.nextCursor}`,
      );
      setData((old) =>
        old
          ? {
              ...result,
              plans: [
                ...old.plans,
                ...result.plans.filter(
                  (p) => !old.plans.some((previous) => previous.id === p.id),
                ),
              ],
            }
          : result,
      );
    });
  }
  return {
    data: data
      ? {
          ...data,
          plans: data.plans.map((p) => ({
            ...p,
            title:
              guest && /^Guest discovery(?: preview)?$/i.test(p.title)
                ? "My project"
                : p.title,
          })),
        }
      : null,
    error,
    busy,
    refresh,
    select,
    create,
    rename,
    more,
  };
}
