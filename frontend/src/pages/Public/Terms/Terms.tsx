import { PageShell } from "../../../components/public/PageShell/PageShell";
import "./Terms.css";
export default function Terms() {
  return (
    <PageShell title="Terms of use">
      <p>
        This website introduces kailor's technology consultancy. Contact{" "}
        <a href="mailto:keenosmith@kailor.co.za">keenosmith@kailor.co.za</a> for
        enquiries.
      </p>
      <section>
        <h2>Website and testing access</h2>
        <p>
          Application features are under controlled testing. Account creation
          may be closed or require an email-bound invitation. Keep account
          credentials private and do not attempt to access another person's work
          or interfere with the service.
        </p>
        <h2>Project engagements</h2>
        <p>
          Website descriptions and application suggestions do not constitute an
          agreed scope, quotation or delivery commitment. Consulting and
          implementation require a separately agreed engagement. Review
          recommendations before acting on them.
        </p>
        <h2>Content and availability</h2>
        <p>
          Technology descriptions and scripted interface previews illustrate the
          work. Features may change during testing. Do not upload content you
          are not entitled to share.
        </p>
        <h2>Publication review</h2>
        <p>
          These initial terms require owner and legal review before launch,
          including contracting entity details, intellectual property,
          liability, consumer rights, jurisdiction and dispute handling. No
          limitation here overrides applicable law.
        </p>
      </section>
    </PageShell>
  );
}
