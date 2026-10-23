import { CONTACT_EMAIL } from "../../../services/enquiries";
import "./ApplicationForm/ApplicationForm.css";

// Public-only alternative. The full-stack form and its private processor gate
// remain unchanged in local/application builds. No CV is uploaded here.
export function ApplicationForm({
  interests,
}: {
  interests: string[];
  sending: boolean;
  setSending: (value: boolean) => void;
}) {
  const body = [
    "Hello kailor,",
    "",
    "I'd like to introduce myself.",
    "",
    interests.length ? `Professional interests: ${interests.join(", ")}` : "",
    "",
    "My background:",
    "",
    "My professional links:",
  ].join("\n");
  return (
    <div className="career-form-card">
      <h2>Your introduction</h2>
      <p>
        Introduce yourself by email with a little about your background,
        professional interests and links to your work. You can attach a CV in
        your email application.
      </p>
      <p>
        No documents are uploaded or stored by this website. Please ask about
        handling before emailing sensitive documents.
      </p>
      <p>
        <a
          className="career-submit"
          href={`mailto:${CONTACT_EMAIL}?subject=Working%20with%20kailor&body=${encodeURIComponent(body)}`}
        >
          Introduce yourself by email
        </a>
      </p>
      <p>
        If your email application does not open, write to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </div>
  );
}
