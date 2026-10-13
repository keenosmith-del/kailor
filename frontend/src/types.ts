import type { Question, Session } from "../../shared/src/index";
export type Next = {
  question: Question | null;
  active: Question[];
  answered: number;
  total: number;
  referenceHints: { question: string; source: string; reason: string }[];
};
export type SessionProps = {
  session: Session;
  busy: boolean;
  act: (fn: () => Promise<unknown>) => Promise<boolean>;
};
