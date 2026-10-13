export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
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
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export async function downloadReport(id: string) {
  const response = await fetch(`/api/sessions/${id}/report.pdf`, {
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
