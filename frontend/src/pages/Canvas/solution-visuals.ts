import {
  Globe2,
  CalendarDays,
  Truck,
  Workflow,
  Instagram,
  ShoppingBag,
  PanelsTopLeft,
  ChartNoAxesCombined,
  ReceiptText,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { SolutionVisual } from "../../../../shared/src/solutions";
import { mascotAssets } from "../../components/Mascot/mascot-assets";

export type SolutionVisualDefinition = {
  solutionIcon: LucideIcon;
  kailorPose: keyof typeof mascotAssets;
  visualVariant: "portrait" | "figure" | "head";
};
/** Presentation-only identities. Extend this map without changing project or recommendation records. */
export const solutionVisuals = {
  website: {
    solutionIcon: Globe2,
    kailorPose: "greeting",
    visualVariant: "portrait",
  },
  booking: {
    solutionIcon: CalendarDays,
    kailorPose: "thinking",
    visualVariant: "portrait",
  },
  delivery: {
    solutionIcon: Truck,
    kailorPose: "attentive",
    visualVariant: "portrait",
  },
  automation: {
    solutionIcon: Workflow,
    kailorPose: "thinking",
    visualVariant: "portrait",
  },
  social: {
    solutionIcon: Instagram,
    kailorPose: "head",
    visualVariant: "head",
  },
  store: {
    solutionIcon: ShoppingBag,
    kailorPose: "greeting",
    visualVariant: "figure",
  },
  platform: {
    solutionIcon: PanelsTopLeft,
    kailorPose: "recommendation",
    visualVariant: "portrait",
  },
  reporting: {
    solutionIcon: ChartNoAxesCombined,
    kailorPose: "thinking",
    visualVariant: "portrait",
  },
  invoicing: {
    solutionIcon: ReceiptText,
    kailorPose: "attentive",
    visualVariant: "portrait",
  },
  "online-presence": {
    solutionIcon: Megaphone,
    kailorPose: "head",
    visualVariant: "head",
  },
} satisfies Record<string, SolutionVisualDefinition>;

export function solutionVisualDefinition(
  type: SolutionVisual,
  title = "",
): SolutionVisualDefinition {
  if (type === "platform") {
    if (/invoic|billing/i.test(title)) return solutionVisuals.invoicing;
    if (/analysis|analytics|reporting|reports?\b/i.test(title))
      return solutionVisuals.reporting;
    if (/online presence|digital presence/i.test(title))
      return solutionVisuals["online-presence"];
  }
  return solutionVisuals[type];
}
