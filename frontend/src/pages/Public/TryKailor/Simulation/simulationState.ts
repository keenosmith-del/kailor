import { chosenAt, questionAt, type Answer } from "./simulationData";
export type Phase =
  | "intro"
  | "questions"
  | "selecting"
  | "summary"
  | "dissolving"
  | "thinking"
  | "typing"
  | "complete";
export interface SimulationState {
  phase: Phase;
  answers: Answer[];
  index: number;
  pending: string | null;
  characters: number;
}
export const initialSimulation: SimulationState = {
  phase: "intro",
  answers: [],
  index: 0,
  pending: null,
  characters: 0,
};
export type SimulationAction =
  | { type: "start" | "restart" | "settle" | "back" }
  | { type: "choose"; choiceId: string }
  | { type: "edit"; index: number }
  | { type: "advance"; from: Phase; to: Phase }
  | { type: "type"; characters: number };
export function simulationReducer(
  state: SimulationState,
  action: SimulationAction,
): SimulationState {
  switch (action.type) {
    case "start":
      return state.phase === "intro"
        ? { ...initialSimulation, phase: "questions" }
        : state;
    case "restart":
      return { ...initialSimulation, phase: "questions" };
    case "choose": {
      const question = questionAt(state.answers, state.index);
      if (
        state.phase !== "questions" ||
        !question?.choices.some((c) => c.id === action.choiceId)
      )
        return state;
      return { ...state, phase: "selecting", pending: action.choiceId };
    }
    case "settle": {
      if (state.phase !== "selecting" || !state.pending) return state;
      const question = questionAt(state.answers, state.index)!;
      const unchanged =
        chosenAt(state.answers, state.index)?.id === state.pending;
      const answers = unchanged
        ? [...state.answers]
        : state.answers.slice(0, state.index);
      answers[state.index] = {
        questionId: question.id,
        choiceId: state.pending,
      };
      return {
        ...state,
        answers,
        pending: null,
        index: Math.min(3, state.index + 1),
        phase: state.index === 3 ? "summary" : "questions",
        characters: 0,
      };
    }
    case "back":
      return state.phase === "questions" && state.index > 0
        ? { ...state, index: state.index - 1 }
        : state;
    case "edit":
      return action.index >= 0 &&
        action.index < state.answers.length &&
        state.phase !== "selecting"
        ? {
            ...state,
            index: action.index,
            phase: "questions",
            pending: null,
            characters: 0,
          }
        : state;
    case "advance":
      return state.phase === action.from
        ? { ...state, phase: action.to }
        : state;
    case "type":
      return state.phase === "typing"
        ? {
            ...state,
            characters: Math.max(state.characters, action.characters),
          }
        : state;
  }
}
