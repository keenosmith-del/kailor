export const sessionHref = (id: string, view: string) =>
  `${window.location.pathname.startsWith("/preview/") ? "/preview" : "/sessions"}/${id}/${view}`;
const endpoint = (path: string) =>
  `/api${window.location.pathname.startsWith("/preview/") && path.startsWith("/sessions") ? "/guest" : ""}${path}`;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "",
    public details?: {
      quality?: import("../../shared/src/index").InputQuality;
      conflicts?: import("../../shared/src/index").DiscoveryConflict[];
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
export async function downloadReport(id: string) {
  const response = await fetch(endpoint(`/sessions/${id}/report.pdf`), {
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
