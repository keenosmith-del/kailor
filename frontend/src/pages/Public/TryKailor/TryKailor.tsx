import { useRef } from "react";
import { PageBack } from "../../../components/public/PageBack/PageBack";
import { ProcessReveal } from "../HowItWorks/ProcessReveal";
import { Simulation } from "./Simulation/Simulation";
import "./TryKailor.css";
export default function TryKailor() {
  const start = useRef<(() => void) | null>(null);
  return (
    <div className="try-kailor-page">
      <noscript>
        <style>{`.try-kailor-page .hiw-scroll-content {opacity:1!important;transform:none!important}.try-kailor-page .try-simulation-wrap{display:none}`}</style>
        <p className="try-noscript">
          Enable JavaScript to make your choices in this interactive preview. No
          account is needed and your choices aren't saved.
        </p>
      </noscript>
      <PageBack />
      <div className="try-opening">
        <div className="try-editorial">
          <ProcessReveal>
            <h1>See where your idea could lead</h1>
          </ProcessReveal>
          <ProcessReveal>
            <p>
              A few simple choices can help reveal a possible direction. Explore
              how kailor approaches different challenges.
            </p>
          </ProcessReveal>
          <ProcessReveal>
            <div className="try-editorial-action">
              <button
                type="button"
                className="pub-pill pub-pill-dark"
                onClick={() => start.current?.()}
              >
                Try it out
              </button>
              <span>Four questions · Interactive preview</span>
            </div>
            <p className="try-transparency">
              A rule-based starting point, without AI processing. Your choices
              stay in this page and aren't saved.
            </p>
          </ProcessReveal>
        </div>
        <Simulation startRef={start} />
      </div>
    </div>
  );
}
