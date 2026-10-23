import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { CloudVisual } from "../src/components/public/StackedPanels/StackedPanels";
const state = vi.hoisted(() => ({ reduced: false, visible: true }));
vi.mock("motion/react", async (original) => ({
  ...(await original<typeof import("motion/react")>()),
  useInView: () => state.visible,
  useReducedMotion: () => state.reduced,
}));
beforeEach(() => {
  state.reduced = false;
  state.visible = true;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("renders the original Built for word animation with no MP4 or poster layer", () => {
  render(<CloudVisual />);
  expect(document.querySelector(".service-art__word-prefix")?.textContent).toBe(
    "Built for",
  );
  expect(
    document.querySelector(".service-art__changing-word")?.textContent,
  ).toBe("clarity");
  expect(document.querySelector("video, img")).toBeNull();
});
it("cycles on the original cadence while visible and cleans up on exit", () => {
  const interval = vi.spyOn(window, "setInterval");
  const clear = vi.spyOn(window, "clearInterval");
  const view = render(<CloudVisual />);
  expect(interval).toHaveBeenCalledWith(expect.any(Function), 1650);
  const timer = interval.mock.results.at(-1)!.value;
  state.visible = false;
  view.rerender(<CloudVisual />);
  expect(clear).toHaveBeenCalledWith(timer);
});
it("returns to the same typography implementation after a route remount", () => {
  const view = render(<CloudVisual />);
  view.unmount();
  render(<CloudVisual />);
  expect(
    document.querySelector(".service-art__changing-word")?.textContent,
  ).toBe("clarity");
  expect(document.querySelector("video, img")).toBeNull();
});
it("uses a static word without a cycling timer in reduced motion", () => {
  state.reduced = true;
  const interval = vi.spyOn(window, "setInterval");
  render(<CloudVisual />);
  expect(interval).not.toHaveBeenCalled();
  expect(
    document.querySelector(".service-art__changing-word")?.textContent,
  ).toBe("clarity");
});
