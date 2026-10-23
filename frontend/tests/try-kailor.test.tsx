import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import TryKailor from "../src/pages/Public/TryKailor/TryKailor";
import { ConversationProvider } from "../src/components/public/ConversationModal/ConversationModal";
const options = vi.hoisted(() => ({ reduced: true }));
vi.mock("motion/react", async (original) => {
  const actual = await original<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => options.reduced,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: actual.motionValue(0.5) }),
  };
});
beforeEach(() => {
  options.reduced = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Preview must not request data");
    }),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function page() {
  return render(
    <MemoryRouter initialEntries={["/try-kailor"]}>
      <ConversationProvider>
        <Routes>
          <Route path="/try-kailor" element={<TryKailor />} />
          <Route path="/" element={<h1>Home destination</h1>} />
        </Routes>
      </ConversationProvider>
    </MemoryRouter>,
  );
}
async function choose(name: string) {
  const button = await screen.findByRole("button", { name, exact: true });
  fireEvent.click(button);
}
async function complete() {
  for (const choice of [
    "I own a business",
    "Too much manual work",
    "Mostly manual records",
    "Less time spent on routine work",
  ])
    await choose(choice);
  await screen.findByRole("heading", { name: "Simplify your workflow" });
}
it("starts with no automatic choices, a meaningful first question and an in-page start action", async () => {
  page();
  expect(
    document.querySelector(".try-simulation")?.getAttribute("data-phase"),
  ).toBe("intro");
  expect(
    screen.getByRole("heading", { name: "Which best describes you?" }),
  ).toBeTruthy();
  expect(screen.queryByRole("group", { name: "Your choices" })).toBeNull();
  await choose("Try it out");
  expect(await screen.findByText("Question 1 of 4")).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Back", exact: true }));
  expect(screen.getByText("Home destination")).toBeTruthy();
});
it("collects actual selections, goes back and edits into a new branch without stale answers", async () => {
  page();
  await choose("I own a business");
  await screen.findByRole("heading", { name: "What needs attention?" });
  await choose("Too much manual work");
  await screen.findByRole("heading", {
    name: "How does the work happen today?",
  });
  expect(
    within(screen.getByRole("group", { name: "Your choices" })).getAllByRole(
      "button",
    ),
  ).toHaveLength(2);
  await choose("Previous question");
  await screen.findByRole("heading", { name: "What needs attention?" });
  await choose("Disconnected information");
  await screen.findByRole("heading", {
    name: "What do you know about the existing tools?",
  });
  await choose("Change answer 1: I own a business");
  await screen.findByRole("heading", { name: "Which best describes you?" });
  await choose("I have an idea");
  await screen.findByRole("heading", {
    name: "What would you like to create?",
  });
  expect(
    within(screen.getByRole("group", { name: "Your choices" })).getAllByRole(
      "button",
    ),
  ).toHaveLength(1);
});
it("completes with the actual mascot, full accessible message, relevant tile, expandable details and clean restart without requests or persistence", async () => {
  const storage = vi.spyOn(Storage.prototype, "setItem");
  page();
  await complete();
  expect(screen.getByAltText("kailor").getAttribute("src")).toBe(
    "/mascot-head.png",
  );
  expect(
    document.querySelector(".try-simulation")?.getAttribute("data-phase"),
  ).toBe("complete");
  await choose("Explore this direction");
  const details = screen.getByRole("region", { name: "Direction details" });
  expect(within(details).getByText(/Mostly manual records/)).toBeTruthy();
  expect(within(details).getByText(/scope and a proposal/)).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("button", { name: "Close direction" }), {
    key: "Escape",
  });
  expect(
    screen.queryByRole("region", { name: "Direction details" }),
  ).toBeNull();
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Explore this direction" }),
  );
  expect(
    screen.getByRole("link", { name: "Create account" }).getAttribute("href"),
  ).toBe("/create-account");
  expect(
    screen.getByRole("link", { name: "Sign in" }).getAttribute("href"),
  ).toBe("/sign-in");
  expect(
    screen.getByText(/controlled-testing registration policy/),
  ).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
  await choose("Try another direction");
  await screen.findByRole("heading", { name: "Which best describes you?" });
  expect(screen.queryByRole("group", { name: "Your choices" })).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Simplify your workflow" }),
  ).toBeNull();
});
it("can review completed choices without losing unchanged answers and open the existing shared chat", async () => {
  page();
  await complete();
  await choose("Review your choices");
  await screen.findByRole("heading", {
    name: "What would make the biggest difference?",
  });
  expect(
    screen
      .getByRole("group", { name: "Your choices" })
      .querySelectorAll("button"),
  ).toHaveLength(4);
  await choose("Continue");
  await screen.findByRole("heading", { name: "Simplify your workflow" });
  await choose("Start a conversation");
  expect(
    await screen.findByRole("dialog", { name: "Let's chat" }),
  ).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});
it("cancels a pending selection timer on unmount", async () => {
  options.reduced = false;
  const clear = vi.spyOn(window, "clearTimeout");
  const schedule = vi.spyOn(window, "setTimeout");
  const view = page();
  await choose("I own a business");
  expect(
    document.querySelector(".try-simulation")?.getAttribute("data-phase"),
  ).toBe("selecting");
  const timer =
    schedule.mock.results[
      schedule.mock.calls.findIndex((call) => call[1] === 360)
    ]?.value;
  expect(timer).toBeDefined();
  view.unmount();
  expect(clear).toHaveBeenCalledWith(timer);
});
