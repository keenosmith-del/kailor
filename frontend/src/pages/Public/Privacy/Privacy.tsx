import { PageShell } from "../../../components/public/PageShell/PageShell";
import "./Privacy.css";
export default function Privacy() {
  return (
    <PageShell title="Privacy">
      <p>
        kailor is a technology consultancy founded in 2025. Contact{" "}
        <a href="mailto:keenosmith@kailor.co.za">keenosmith@kailor.co.za</a>{" "}
        about privacy or your information.
      </p>
      <section>
        <h2>Information we use</h2>
        <p>
          Enquiries contain the name, email and message you choose to send. The
          conversation form sends these through EmailJS when configured. You can
          also contact us directly by email. Please avoid sending sensitive
          information in an initial enquiry.
        </p>
        <p>
          Approved testing accounts store a name, email, a password hash and
          session records. Private project features store conversations,
          discovery answers, uploaded text sources, recommendations and project
          decisions. Guest exploration, when enabled, creates temporary work
          under a separate identity.
        </p>
        <h2>Purpose and services</h2>
        <p>
          We use this information to respond to enquiries, authenticate users,
          secure the service and support requested project work. The API records
          request identifiers, methods and status codes; hosting providers may
          also record connection and access information.
        </p>
        <p>
          The application can use Cloudflare for AI assistance only when
          explicitly configured. Project context may then be sent to that
          provider. The public website demonstrations do not make AI requests.
          No analytics or advertising trackers are integrated.
        </p>
        <h2>Retention and requests</h2>
        <p>
          Account sessions expire after eight hours. Guest sessions expire after
          24 hours. The API attempts to remove expired guest identities and
          their work at startup and every 15 minutes, in batches of up to 50;
          deletion can be delayed if cleanup fails or a backlog exists. Guest
          exit explicitly discards guest work. A general account and enquiry
          retention and deletion schedule is not yet implemented. Contact us to
          request access, correction, deletion or to raise an objection; we will
          assess the request and any applicable retention duties.
        </p>
        <p>
          You can raise privacy concerns with the{" "}
          <a href="https://inforegulator.org.za/complaints/">
            South African Information Regulator
          </a>
          .
        </p>
        <h2>Publication review</h2>
        <p>
          This initial notice requires owner and legal review before launch,
          including the responsible party details, Information Officer, lawful
          grounds, retention periods, hosting locations, service providers and
          any international transfers. It does not certify legal compliance.
        </p>
      </section>
    </PageShell>
  );
}
