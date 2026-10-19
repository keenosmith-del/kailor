import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Preference } from "../../../../shared/src/index";
import type { Account } from "../../types/account";
import { api } from "../../services/api";
import { ErrorBox } from "../../components/ErrorBox/ErrorBox";
import { errorMessage } from "../../utils/errorMessage";
import "../../components/EntryButton/EntryButton.css";

export function SettingsPage({ guest }: { guest: boolean }) {
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [model, setModel] = useState<{ configured: boolean } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void api<{ configured: boolean }>("/model-status")
      .then(setModel)
      .catch(() => {});
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
      <h2>Model assistance</h2>
      <p>
        {model
          ? model.configured
            ? "kailor can use Cloudflare to help with replies when privacy checks and usage limits allow. Availability can vary."
            : "Local guidance is available. Online model assistance is not configured for this session."
          : "Checking model configuration…"}
      </p>
      <h2>Your information</h2>
      <details>
        <summary>What kailor remembers</summary>
        <p>
          Conversations and proposed details are stored with your project.
          Confirmed information informs Discovery, Chat, the canvas and future
          assessments. Clearing Chat archives its transcript and excludes it
          from model context; confirmed facts and saved reports remain.
        </p>
      </details>
      <details>
        <summary>Answers and saved assessments</summary>
        <p>
          Discovery answers persist in this project. Starting from the beginning
          retires guided answers and their evidence while keeping Chat-confirmed
          facts. Saved reports are immutable; new findings inform a new version.
        </p>
      </details>
      <details>
        <summary>Guest access and online assistance</summary>
        <p>
          Guest access uses a browser-session cookie with a maximum of 24 hours.
          Refreshing keeps your active work. Closing a tab cannot guarantee
          deletion, and browsers may restore session cookies. End guest session
          discards temporary work immediately. Expired guest data is removed by
          regular server cleanup; it may remain until cleanup runs. Explicit
          account transfer ends guest access. When configured, Cloudflare
          processes bounded project context; sensitive context stays local.
          Uploaded text is reference material, not instructions or confirmed
          facts.
        </p>
      </details>
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
  session,
}: {
  session: import("../../../../shared/src/index").Session | null;
  account: Account | null;
  guest: boolean;
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transferKey] = useState(() => crypto.randomUUID());
  const [guestPlanId, setGuestPlanId] = useState(session?.planId);
  useEffect(() => {
    if (guest && id)
      void api<import("../../../../shared/src/index").Session>(
        `/sessions/${id}`,
      )
        .then((s) => setGuestPlanId(s.planId))
        .catch((e) => setError(errorMessage(e)));
  }, [guest, id]);
  const resume =
    new URLSearchParams(window.location.search).get("resume") === "consultancy";
  const returnTo = encodeURIComponent(
    `/preview/${id}/account${resume ? "?resume=consultancy" : ""}`,
  );
  async function transfer() {
    if (!consent || !guestPlanId || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ sessionId: string }>(
        "/guest/transfer",
        "POST",
        { consent: true, transferKey, planId: guestPlanId },
      );
      navigate(
        `/app/${result.sessionId}/${resume ? "canvas?resume=consultancy" : "chat"}`,
        { replace: true },
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="application-personal">
      <h1>Account</h1>
      <ErrorBox error={error} />
      {guest ? (
        <>
          <h2>Make room for more ideas.</h2>
          <p>
            You're exploring as a guest. An account lets you keep projects and
            conversations, revisit assessments and resources, and make space for
            more than one idea.
          </p>
          <p className="account-session-note">
            Sign in or create an account, then choose whether to keep this
            project. Nothing transfers automatically. Temporary access lasts at
            most 24 hours; use End guest session to discard it now. Expired data
            is removed by regular server cleanup and cannot be recovered here.
          </p>
          {account ? (
            <div className="guest-transfer">
              <p>
                Signed in as {account.email}. Your existing account projects
                will be preserved.
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />{" "}
                I agree to move this guest project, conversations, confirmed
                details, reports and sources to my account and end its guest
                access.
              </label>
              <button
                className="button primary"
                disabled={!consent || busy || !guestPlanId}
                onClick={() => void transfer()}
              >
                {busy
                  ? "Keeping your project…"
                  : "Keep this project in my account"}
              </button>
            </div>
          ) : (
            <div className="actions account-entry-actions">
              <Link
                className="entry-button entry-button--light"
                to={`/sign-in?returnTo=${returnTo}`}
              >
                <img src="/svgs/profile.svg" alt="" width="17" height="17" />
                Sign in
              </Link>
              <Link
                className="button"
                to={`/create-account?returnTo=${returnTo}`}
              >
                Create account
              </Link>
            </div>
          )}
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
