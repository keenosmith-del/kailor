import "./InviteForm.css";
import { useState } from "react";
import { api } from "../../../../services/api";
import { ErrorBox } from "../../../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../../../utils/errorMessage";
export function InviteForm() {
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
