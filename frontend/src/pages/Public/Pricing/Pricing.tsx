import { PricingHero } from "./PricingHero/PricingHero";
import { PricingOptions } from "./PricingOptions/PricingOptions";
import { PricingQuestions } from "./PricingQuestions/PricingQuestions";
import { PricingClosing } from "./PricingClosing/PricingClosing";
import "./Pricing.css";
export default function Pricing() {
  return (
    <>
      <PricingHero />
      <PricingOptions />
      <PricingQuestions />
      <PricingClosing />
    </>
  );
}
