import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { WhatWeveBuilt } from "../src/pages/Public/Home/WhatWeveBuilt/WhatWeveBuilt";
import { capabilities } from "../src/pages/Public/Home/WhatWeveBuilt/capabilities";
import { archiveCapabilities } from "../src/pages/Public/Timeline/timelineData";
import { ConversationProvider } from "../src/components/public/ConversationModal/ConversationModal";
vi.mock("motion/react", async (original) => {
  const actual = await original<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => true,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: actual.motionValue(0.5) }),
  };
});
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("No public purchase request");
    }),
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("shares the canonical capability copy with the recoverable Timeline and preserves four distinct interface illustrations", () => {
  expect(archiveCapabilities).toBe(capabilities);
  render(
    <MemoryRouter>
      <ConversationProvider>
        <WhatWeveBuilt />
      </ConversationProvider>
    </MemoryRouter>,
  );
  expect(document.querySelector(".company-timeline-page")).toBeNull();
  expect(document.querySelectorAll(".built-archive-card")).toHaveLength(4);
  for (const cls of ["discovery", "analysis", "canvas", "workspace"])
    expect(document.querySelector(`.built-archive-${cls}`)).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "What we've built" }),
  ).toBeTruthy();
  expect(
    document.querySelector(".built-workspace-request img")?.getAttribute("src"),
  ).toBe("/mascot-head.png");
});
it.each(capabilities)(
  "opens $title detail, contains keyboard focus and restores the card after closing",
  (capability) => {
    render(
      <MemoryRouter>
        <ConversationProvider>
          <WhatWeveBuilt />
        </ConversationProvider>
      </MemoryRouter>,
    );
    const card = screen.getByRole("button", {
      name: `Explore ${capability.title}`,
    });
    card.focus();
    fireEvent.click(card);
    const dialog = screen.getByRole("dialog", { name: capability.title });
    expect(within(dialog).getByText(capability.detail)).toBeTruthy();
    const close = within(dialog).getByRole("button", {
      name: "Close capability detail",
    });
    expect(close.classList.contains("modal-close")).toBe(true);
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(card);
    expect(document.body.style.overflow).not.toBe("hidden");
  },
);
