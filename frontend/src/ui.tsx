export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong.";
export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : null;
}
