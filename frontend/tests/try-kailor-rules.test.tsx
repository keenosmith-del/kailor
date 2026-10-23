import { expect, it } from "vitest";
import {
  questionAt,
  startingQuestion,
  chosenAt,
  completeJourney,
  type Answer,
  type Direction,
} from "../src/pages/Public/TryKailor/Simulation/simulationData";
import { recommend } from "../src/pages/Public/TryKailor/Simulation/recommendationRules";
import {
  initialSimulation,
  simulationReducer as reduce,
  type SimulationState,
} from "../src/pages/Public/TryKailor/Simulation/simulationState";
function journey(ids: string[]) {
  const answers: Answer[] = [];
  ids.forEach((id, index) => {
    const q = questionAt(answers, index)!;
    expect(q.choices.some((c) => c.id === id)).toBe(true);
    answers.push({ questionId: q.id, choiceId: id });
  });
  return answers;
}
it("branches the focus, context and final questions from real prior choices", () => {
  const followups = startingQuestion.choices.map(
    (c) => questionAt([{ questionId: "situation", choiceId: c.id }], 1)!.title,
  );
  expect(new Set(followups).size).toBe(4);
  const ai = journey(["idea", "intelligent"]),
    cloud = journey(["specific", "infrastructure"]);
  expect(questionAt(ai, 2)!.title).toContain("information");
  expect(questionAt(cloud, 2)!.title).toContain("infrastructure");
  expect(questionAt(ai, 3)!.id).not.toBe(questionAt(cloud, 3)!.id);
});
it.each([
  [["business", "manual", "manual-records", "time"], "workflow"],
  [["business", "disconnected", "access-known", "accuracy"], "integration"],
  [["idea", "application", "new-experience", "small-test"], "digital"],
  [["specific", "automation", "data-sensitive", "scope-review"], "ai"],
  [["unsure", "limitations", "reliability", "map"], "technical"],
  [["idea", "shaping", "problem-unclear", "validate-audience"], "idea"],
  [
    ["specific", "infrastructure", "first-deployment", "scope-defined"],
    "cloud",
  ],
  [["specific", "connections", "access-limited", "scope-draft"], "technical"],
  [["idea", "application", "audience-unclear", "small-test"], "idea"],
  [["idea", "intelligent", "data-unclear", "feasibility"], "technical"],
] as [string[], Direction][])(
  "selects a relevant direction for %j",
  (ids, id) => {
    const answers = journey(ids),
      result = recommend(answers)!;
    expect(result.id).toBe(id);
    expect(result.message).toBeTruthy();
    expect(result.direction).toBeTruthy();
    expect(result.next).toBe(chosenAt(answers, 3)!.consideration);
    expect(result.why).toContain(chosenAt(answers, 1)!.label);
  },
);
it("produces complete deterministic outcomes for every valid journey and uses the context and priority", () => {
  let count = 0;
  const outcomes = new Set<string>();
  function walk(answers: Answer[]) {
    if (answers.length === 4) {
      count++;
      expect(completeJourney(answers)).toBe(true);
      const result = recommend(answers)!;
      expect(result).toEqual(recommend(answers));
      expect(result.message).toContain(chosenAt(answers, 2)!.consideration);
      expect(result.why).toContain(chosenAt(answers, 3)!.label);
      outcomes.add(result.id);
      return;
    }
    const q = questionAt(answers, answers.length)!;
    for (const c of q.choices)
      walk([...answers, { questionId: q.id, choiceId: c.id }]);
  }
  walk([]);
  expect(count).toBe(144);
  expect(outcomes.size).toBe(7);
  expect(recommend([])).toBeNull();
  expect(
    recommend([
      ...journey(["business", "manual"]),
      { questionId: "cloud-context", choiceId: "first-deployment" },
      { questionId: "business-priority", choiceId: "time" },
    ]),
  ).toBeNull();
});
function select(state: SimulationState, id: string) {
  return reduce(reduce(state, { type: "choose", choiceId: id }), {
    type: "settle",
  });
}
it("guards rapid clicks, invalid choices, and stale phase callbacks", () => {
  let state = reduce(initialSimulation, { type: "start" });
  state = reduce(state, { type: "choose", choiceId: "business" });
  expect(reduce(state, { type: "choose", choiceId: "idea" })).toBe(state);
  state = reduce(state, { type: "settle" });
  expect(state.index).toBe(1);
  expect(state.answers[0].choiceId).toBe("business");
  expect(reduce(state, { type: "settle" })).toBe(state);
  expect(reduce(state, { type: "choose", choiceId: "invalid" })).toBe(state);
  const reset = reduce(state, { type: "restart" });
  expect(
    reduce(reset, { type: "advance", from: "thinking", to: "typing" }),
  ).toBe(reset);
});
it("preserves relevant answers when revisiting and invalidates downstream answers when a choice changes", () => {
  let state = reduce(initialSimulation, { type: "start" });
  for (const id of ["business", "manual", "manual-records", "time"])
    state = select(state, id);
  expect(state.phase).toBe("summary");
  const complete = state.answers;
  state = reduce(state, { type: "edit", index: 1 });
  state = select(state, "manual");
  expect(state.answers).toEqual(complete);
  state = reduce(state, { type: "back" });
  state = select(state, "disconnected");
  expect(state.answers).toHaveLength(2);
  expect(questionAt(state.answers, 2)!.id).toBe("integration-context");
  state = reduce(state, { type: "edit", index: 0 });
  state = select(state, "idea");
  expect(state.answers).toHaveLength(1);
  expect(questionAt(state.answers, 1)!.id).toBe("idea-focus");
  expect(reduce(state, { type: "restart" }).answers).toEqual([]);
});
