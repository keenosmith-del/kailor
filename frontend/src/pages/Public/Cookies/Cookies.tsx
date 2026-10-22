import { PageShell } from "../../../components/public/PageShell/PageShell";
import "./Cookies.css";
export default function Cookies() {
  return (
    <PageShell title="Cookie information">
      <p>
        kailor currently uses essential session cookies and browser storage. No
        optional analytics or advertising trackers are integrated.
      </p>
      <section>
        <h2>Session cookies</h2>
        <p>
          kailor_session authenticates approved accounts, is scoped to /api and
          expires after eight hours. kailor_guest is used only for enabled guest
          exploration and is scoped to /api/guest. Its browser cookie is
          session-scoped; the server session expires after 24 hours. Both are
          HttpOnly, SameSite=Strict and Secure in production.
        </p>
        <h2>Browser storage</h2>
        <p>
          kailor.cookie-preferences.v1 remembers an essential-only preference in
          this browser until you clear site data. Private application features
          also remember interface choices and temporary drafts in browser
          storage. This is separate from your server account data.
        </p>
        <h2>Your choices</h2>
        <p>
          Open Cookies in the footer to review and update preferences. You may
          continue browsing without saving a preference. Browser settings can
          clear or block stored data; blocking essential session cookies
          prevents sign-in and guest continuity.
        </p>
        <h2>Publication review</h2>
        <p>
          The owner must review the final hosting and email configuration and
          verify third-party behaviour before launch. Any future optional
          tracking requires a separate choice before loading.
        </p>
      </section>
    </PageShell>
  );
}
