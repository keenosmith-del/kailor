import type { Session } from "../../shared/src/index";
export type Next = import("../../shared/src/index").DiscoveryPlan;
export type SessionProps = {
  session: Session;
  busy: boolean;
  act: (
    fn: () => Promise<unknown>,
    onError?: (error: unknown) => boolean,
  ) => Promise<boolean>;
};
