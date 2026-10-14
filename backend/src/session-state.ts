import type { Prisma } from "./generated/prisma/client.js";
import type {
  Answers,
  AnswerStates,
  Evidence,
} from "../../shared/src/index.js";
import { inferResponseState } from "./input-quality.js";
export type StoredSession = Prisma.DiscoverySessionGetPayload<{
  include: { subject: true; answers: true; messages: true; evidence: true };
}>;
export const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export function answersOf(session: {
  answers: { questionId: string; value: unknown }[];
}): Answers {
  return Object.fromEntries(
    session.answers.map((a) => [a.questionId, a.value]),
  ) as Answers;
}
export function statesOf(s: {
  answers: {
    questionId: string;
    value: unknown;
    skipped: boolean;
    responseState?: string;
  }[];
}): AnswerStates {
  return Object.fromEntries(
    s.answers.map((a) => [
      a.questionId,
      a.responseState && a.responseState !== "answered"
        ? a.responseState
        : inferResponseState(a.value, a.skipped),
    ]),
  ) as AnswerStates;
}
export const evidenceOf = (s: { evidence: unknown[] }) =>
  s.evidence as Evidence[];
