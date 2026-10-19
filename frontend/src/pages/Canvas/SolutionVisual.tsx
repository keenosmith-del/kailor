import "./SolutionVisual.css";
import type { SolutionVisual as Visual } from "../../../../shared/src/solutions";
import { mascotAssets } from "../../components/Mascot/mascot-assets";
import {
  solutionVisualDefinition,
  type SolutionVisualDefinition,
} from "./solution-visuals";

/** A compact kailor identity and a concrete solution icon, shared by tiles and details. */
export function SolutionVisual({
  type,
  title,
  identity,
}: {
  type: Visual;
  title?: string;
  identity?: SolutionVisualDefinition;
}) {
  const {
    solutionIcon: Icon,
    kailorPose,
    visualVariant,
  } = identity ?? solutionVisualDefinition(type, title);
  return (
    <div
      className={`solution-visual solution-visual--${visualVariant}`}
      aria-hidden="true"
    >
      <div className="solution-identity">
        <div className="solution-identity-portrait">
          <img
            src={mascotAssets[kailorPose]}
            alt=""
            width={visualVariant === "head" ? 1254 : 1024}
            height={visualVariant === "head" ? 1254 : 1536}
            decoding="async"
          />
        </div>
        <span className="solution-identity-icon">
          <Icon strokeWidth={1.55} />
        </span>
      </div>
    </div>
  );
}
