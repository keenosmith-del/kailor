import { PageBack } from "../../../components/public/PageBack/PageBack";
import { ProcessReveal } from "./ProcessReveal";
import { DiscoverySequence } from "./DiscoverySequence/DiscoverySequence";
import { SolutionDirection } from "./SolutionDirection/SolutionDirection";
import { ConsultancyProgress } from "./ConsultancyProgress/ConsultancyProgress";
import { ProcessClosing } from "./ProcessClosing/ProcessClosing";
import "./HowItWorks.css";

export default function HowItWorks() {
  return (
    <div className="how-it-works-page">
      <div className="hiw-back">
        <PageBack />
      </div>
      <section className="hiw-opening" aria-labelledby="hiw-title">
        <div className="hiw-opening-copy">
          <ProcessReveal>
            <h1 id="hiw-title">
              The right solution starts with the right understanding
            </h1>
          </ProcessReveal>
          <ProcessReveal>
            <p>
              Tell kailor a little about your situation. We'll help make sense
              of the challenge, explore what's possible and work out what
              deserves attention
            </p>
          </ProcessReveal>
        </div>
        <ProcessReveal className="hiw-discovery-reveal">
          <DiscoverySequence />
        </ProcessReveal>
      </section>
      <SolutionDirection />
      <ConsultancyProgress />
      <ProcessClosing />
    </div>
  );
}
