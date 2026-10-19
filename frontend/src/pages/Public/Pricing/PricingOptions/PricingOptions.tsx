import { Engagements } from "../../../../components/public/Engagements/Engagements";
import "./PricingOptions.css";
export function PricingOptions() {
  return (
    <section className="public-section pricing-options">
      <h2 className="sr-only">Engagement options</h2>
      <Engagements />
      <p className="pricing-availability">
        The platform is evolving. Public exploration availability and any
        commercial free-tier limits require confirmation. Guided and Custom
        engagements are by enquiry; no subscription, checkout or fixed price is
        offered here.
      </p>
    </section>
  );
}
