import { ProcessHero } from "./ProcessHero/ProcessHero";
import { ProcessOverview } from "./ProcessOverview/ProcessOverview";
import { ProcessEditorial } from "./ProcessEditorial/ProcessEditorial";
import { HumanAI } from "./HumanAI/HumanAI";
import { ProcessClosing } from "./ProcessClosing/ProcessClosing";
import "./HowItWorks.css";
export default function HowItWorks() {
  return (
    <>
      <ProcessHero />
      <ProcessOverview />
      <ProcessEditorial />
      <HumanAI />
      <ProcessClosing />
    </>
  );
}
