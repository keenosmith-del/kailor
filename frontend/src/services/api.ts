export const sessionHref = (id: string, view: string) => {
  const destination =
    ({ conversation: "chat", report: "analysis" } as Record<string, string>)[
      view
    ] ?? view;
  return `${window.location.pathname.startsWith("/preview/") ? "/preview" : "/app"}/${id}/${destination}`;
};
const endpoint = (path: string) =>
  `/api${window.location.pathname.startsWith("/preview/") && ["/sessions", "/plans", "/preferences", "/model-status"].some((prefix) => path.startsWith(prefix)) ? "/guest" : ""}${path}`;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "",
    public details?: {
      quality?: import("../../../shared/src/index").InputQuality;
      conflicts?: import("../../../shared/src/index").DiscoveryConflict[];
    },
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(endpoint(path), {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    if (
      response.status === 401 &&
      /^\/(app|workspace|plans|sessions)(?:\/|$)/.test(window.location.pathname)
    ) {
      window.location.replace(
        `/sign-in?returnTo=${encodeURIComponent(window.location.pathname)}`,
      );
    }
    const payload = await response.json().catch(() => ({
      error: { message: "The service could not be reached." },
    }));
    throw new ApiError(
      response.status,
      payload.error?.message ?? "Request failed",
      payload.error?.code ?? "",
      payload.error?.details,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export async function downloadReport(id: string, reportId?: string) {
  const path = reportId
    ? `/plans/${id}/reports/${reportId}/pdf`
    : `/sessions/${id}/report.pdf`;
  const response = await fetch(endpoint(path), {
    credentials: "same-origin",
  });
  if (!response.ok)
    throw new Error(
      "Could not download the report. Please sign in again or prepare an assessment.",
    );
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "kailor-analysis-draft.pdf";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function uploadSource(planId: string, file: File) {
  if (file.size > 65536) throw new Error("Files must be smaller than 64 KB.");
  const response = await fetch(endpoint(`/plans/${planId}/sources/file`), {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-File-Name": file.name.replace(/[^\x20-\x7e]/g, "_"),
    },
    body: file,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "Could not extract this file.");
  }
  return response.json();
}
