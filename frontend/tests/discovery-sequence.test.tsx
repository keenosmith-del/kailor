import { StrictMode, createElement, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ visible: true, reduced: false }));
vi.mock("motion/react", () => {
  const components: Record<string, unknown> = {};
  return {
    useInView: () => state.visible,
    useReducedMotion: () => state.reduced,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    LayoutGroup: ({ children }: { children: ReactNode }) => children,
    motion: new Proxy(
      {},
      {
        get: (_, tag: string) =>
          (components[tag] ??= ({
            children,
            ...props
          }: Record<string, unknown>) => {
            for (const key of [
              "initial",
              "animate",
              "exit",
              "transition",
              "layoutId",
            ])
              delete props[key];
            return createElement(tag, props, children as ReactNode);
          }),
      },
    ),
  };
});
import {
  DiscoverySequence,
  recommendation,
  discoveryCycleDuration,
} from "../src/pages/Public/HowItWorks/DiscoverySequence/DiscoverySequence";
beforeEach(() => {
  vi.useFakeTimers();
  state.visible = true;
  state.reduced = false;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
it("gathers five answers in order, removes them, thinks, types holds it for reading and loops automatically", () => {
  render(<DiscoverySequence />);
  for (const answer of [
    "I own a business",
    "Orders and stock",
    "Stock records don't match",
    "Online store and spreadsheets",
    "Less manual updating",
  ]) {
    tick(1240);
    expect(
      document.querySelector(".discovery-choice.is-selected")?.textContent,
    ).toBe(answer);
    tick(600);
    expect(
      Array.from(document.querySelectorAll(".discovery-gathered-pill")).at(-1)
        ?.textContent,
    ).toBe(answer);
    tick(1160);
  }
  expect(document.querySelectorAll(".discovery-gathered-pill")).toHaveLength(5);
  tick(1240);
  expect(document.querySelectorAll(".discovery-gathered-pill")).toHaveLength(0);
  tick(480);
  expect(document.querySelector(".discovery-thinking")).toBeTruthy();
  tick(1520);
  const part = document.querySelector(
    ".discovery-response-typed",
  )!.textContent!;
  expect(part.length).toBeGreaterThan(0);
  expect(part.length).toBeLessThan(recommendation.length);
  tick(6000);
  expect(document.querySelector(".discovery-response-typed")?.textContent).toBe(
    recommendation,
    discoveryCycleDuration,
  );
  expect(vi.getTimerCount()).toBe(1);
  tick(2000);
  expect(document.querySelector("[data-phase=complete]")).toBeTruthy();
  tick(Math.ceil((discoveryCycleDuration - 26240) / 40) * 40);
  expect(document.querySelector("[data-phase=questions]")).toBeTruthy();
  expect(document.querySelector(".discovery-question-title")?.textContent).toBe(
    "Which best describes you?",
  );
});
it("pauses offscreen and when hidden without resetting progress", () => {
  const view = render(<DiscoverySequence />);
  tick(1840);
  state.visible = false;
  view.rerender(<DiscoverySequence />);
  expect(vi.getTimerCount()).toBe(0);
  tick(10000);
  expect(document.querySelectorAll(".discovery-gathered-pill")).toHaveLength(1);
  state.visible = true;
  view.rerender(<DiscoverySequence />);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  fireEvent(document, new Event("visibilitychange"));
  expect(vi.getTimerCount()).toBe(0);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  fireEvent(document, new Event("visibilitychange"));
  tick(1200);
  expect(document.querySelector(".discovery-question-title")?.textContent).toBe(
    "What needs attention?",
  );

  expect(vi.getTimerCount()).toBe(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("has one clock in StrictMode and a complete static example for reduced motion", () => {
  const view = render(
    <StrictMode>
      <DiscoverySequence />
    </StrictMode>,
  );
  expect(vi.getTimerCount()).toBe(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
  state.reduced = true;
  render(<DiscoverySequence />);
  expect(document.querySelector(".discovery-response-typed")?.textContent).toBe(
    recommendation,
    discoveryCycleDuration,
  );
  expect(document.querySelector(".discovery-choice")).toBeNull();
  expect(document.querySelector(".discovery-thinking")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  tick(discoveryCycleDuration * 2);
  expect(document.querySelector("[data-phase=complete]")).toBeTruthy();
});
