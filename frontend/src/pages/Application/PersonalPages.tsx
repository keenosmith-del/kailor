import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Preference } from "../../../../shared/src/index";
import type { Account } from "../../types/account";
import { api } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";

export function SettingsPage({ guest }: { guest: boolean }) {
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void api<Preference[]>("/preferences")
      .then(setPrefs)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  async function save(key: string, value: string) {
    setBusy(true);
    setError("");
    try {
      setPrefs(
        await api<Preference[]>("/preferences", "PUT", {
          key,
          value: value || null,
          revision: prefs.find((p) => p.key === key)?.revision ?? 0,
        }),
      );
    } catch (e) {
      setError(errorMessage(e));
      void api<Preference[]>("/preferences")
        .then(setPrefs)
        .catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="application-personal">
      <h1>Settings</h1>
      <p className="lead">
        A few preferences for working together. Each project's requirements take
        priority.
      </p>
      <ErrorBox error={error} />
      <label>
        Explanation style
        <select
          disabled={busy}
          value={prefs.find((p) => p.key === "communicationStyle")?.value ?? ""}
          onChange={(e) => void save("communicationStyle", e.target.value)}
        >
          <option value="">No saved preference</option>
          <option value="plain-language">Plain language</option>
          <option value="technical-detail">Technical detail</option>
        </select>
      </label>
      <label>
        Implementation preference
        <select
          disabled={busy}
          value={
            prefs.find((p) => p.key === "implementationPreference")?.value ?? ""
          }
          onChange={(e) =>
            void save("implementationPreference", e.target.value)
          }
        >
          <option value="">No saved preference</option>
          <option value="existing-tools-first">
            Explore existing tools first
          </option>
          <option value="custom-when-justified">
            Consider custom work when justified
          </option>
        </select>
      </label>
      <h2>Privacy and memory</h2>
      <p>
        Project information is private to you. Confirmed details help guide
        Discovery, Chat and Analysis. You can clear a conversation's transcript
        and its AI context from Chat; confirmed facts and existing reports
        remain saved.
      </p>
      <p>
        {guest
          ? "These preferences belong to your temporary guest profile."
          : "These preferences apply across your projects."}{" "}
        Clearing either preference removes it from future model context.
      </p>
    </section>
  );
}
export function AccountPage({
  account,
  guest,
}: {
  account: Account | null;
  guest: boolean;
}) {
  return (
    <section className="application-personal">
      <h1>Account</h1>
      {guest ? (
        <>
          <h2>You're exploring as a guest.</h2>
          <p>
            Your temporary project is saved with this browser's guest session
            for 24 hours. Keep using Chat, Discovery, Solution canvas and
            Analysis here.
          </p>
          <p>
            Guest work stays separate when you sign in or create an account.
            Transfer and recovery are not currently supported; download your
            reports before leaving.
          </p>
          <div className="actions">
            <Link className="button primary" to="/sign-in">
              Sign in
            </Link>
            <Link className="button" to="/create-account">
              Create account
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2>{account?.name || "Your profile"}</h2>
          <p>{account?.email}</p>
          <p>
            Your projects and saved reports are available when you sign back in.
          </p>
          <Link className="text-link" to="/preview/discovery">
            Return to temporary guest work in this browser
          </Link>
          {account?.role === "admin" && (
            <p>
              <Link className="text-link" to="/founder">
                Founder tools
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
