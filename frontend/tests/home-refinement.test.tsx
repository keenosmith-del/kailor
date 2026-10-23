import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { readdirSync } from "node:fs";
import {
  technologyItems,
  marqueeItems,
} from "../src/pages/Public/Home/Marquee/marqueeData";
import {
  introductionMetrics,
  perspectiveMetrics,
} from "../src/pages/Public/Home/homeMetrics";
import { Marquee } from "../src/pages/Public/Home/Marquee/Marquee";
import { Introduction } from "../src/pages/Public/Home/Introduction/Introduction";
import { Perspective } from "../src/pages/Public/Home/Perspective/Perspective";
import { Activity } from "../src/pages/Public/Home/Activity/Activity";
import { StackedPanels } from "../src/components/public/StackedPanels/StackedPanels";
import {
  sidebarPages,
  sidebarSections,
  showClientPerspectives,
} from "../src/components/public/navigation";
const state = vi.hoisted(() => ({ reduced: true, count: vi.fn() }));
vi.mock("motion/react", async (original) => {
  const actual = await original<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => state.reduced,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: actual.motionValue(0.5) }),
    animate: (
      from: number,
      to: number,
      options: { onUpdate: (n: number) => void },
    ) => {
      state.count(from, to);
      options.onUpdate(to);
      return { stop: vi.fn() };
    },
  };
});
beforeEach(() => {
  state.reduced = true;
  state.count.mockClear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("keeps every local technology exactly once in the canonical inventory and pairs icons/names without wreaths", () => {
  const files = readdirSync("public/technology/")
    .filter((f) => f.endsWith(".svg"))
    .sort();
  expect(
    technologyItems.map((item) => item.logo!.split("/").at(-1)).sort(),
  ).toEqual(files);
  expect(new Set(marqueeItems.map((item) => item.name)).size).toBe(
    marqueeItems.length,
  );
  expect(technologyItems).toHaveLength(31);
  expect(marqueeItems).toHaveLength(43);
  render(<Marquee />);
  expect(document.querySelectorAll(".home-marquee__group")).toHaveLength(2);
  expect(
    document.querySelectorAll(
      '.home-marquee__group[aria-hidden="false"] .home-marquee__item',
    ),
  ).toHaveLength(43);
  expect(document.querySelectorAll('[src="/laurel-wreath.png"]')).toHaveLength(
    0,
  );
  expect(
    screen
      .getByRole("region", { name: "Capabilities and technologies" })
      .getAttribute("tabindex"),
  ).toBe("0");
  for (const entry of document.querySelectorAll(
    '.home-marquee__group[aria-hidden="false"] .home-marquee__item',
  )) {
    expect(entry.querySelector(".home-marquee__symbol")).toBeTruthy();
    expect(
      entry.querySelector(".home-marquee__name")?.textContent,
    ).toBeTruthy();
  }
});
it("presents experience evidence, six portraits plus the owner count, and editorial business themes", () => {
  state.reduced = false;
  render(
    <MemoryRouter>
      <Introduction />
      <Perspective />
    </MemoryRouter>,
  );
  expect(introductionMetrics.map((metric) => metric.value)).toEqual([
    "6+",
    "8+",
    "3+",
  ]);
  expect(perspectiveMetrics.map((metric) => metric.value)).toEqual([
    "Simplify",
    "Integrate",
    "Build",
    "Evolve",
  ]);
  expect(screen.getByRole("heading", { name: "About" })).toBeTruthy();
  expect(document.querySelectorAll(".introduction-avatar img")).toHaveLength(6);
  expect(
    document.querySelector(".introduction-avatar--additional")?.textContent,
  ).toBe("+32");
  expect(state.count.mock.calls.map((call) => call[1])).toEqual([6, 8, 3]);
  expect(introductionMetrics.every((metric) => !!metric.basis)).toBe(true);
  expect(perspectiveMetrics.map((m) => m.description).join(" ")).not.toMatch(
    /Discovery|Analysis|Solution Canvas|PDF|1:1/,
  );
});
it("preserves all four service panels, cloud words without a period, and the local consultancy mascot", () => {
  render(<StackedPanels />);
  expect(document.querySelectorAll(".service-panel")).toHaveLength(4);
  expect(
    Array.from(document.querySelectorAll(".service-panel h3")).map(
      (el) => el.textContent,
    ),
  ).toEqual([
    "Technology consultancy",
    "Software engineering",
    "AI & automation",
    "Cloud & infrastructure",
  ]);
  expect(
    document.querySelector(".service-art__changing-word strong")?.textContent,
  ).toBe("clarity");
  expect(
    document.querySelector(".service-art__mascot")?.getAttribute("src"),
  ).toBe("/kailor-head.png");
  expect(document.querySelector("video,.service-art__video-poster")).toBeNull();
});
it("preserves six Activity surfaces inside stationary slots with separate reveal and hover elements", () => {
  render(<Activity />);
  const slots = document.querySelectorAll(".home-activity__bubble-slot");
  expect(slots).toHaveLength(6);
  expect(
    document.querySelectorAll(".home-activity__bubble.is-dark"),
  ).toHaveLength(3);
  expect(
    Array.from(slots).map(
      (slot) => slot.querySelector(".home-activity__name")?.textContent,
    ),
  ).toEqual([
    "AI-assisted discovery",
    "Project workspaces",
    "Solution canvas",
    "Consultant messaging",
    "Cloud foundations",
    "Assessment reports",
  ]);
  for (const slot of slots) {
    expect((slot as HTMLElement).style.transform).toBe("");
    expect(
      slot.firstElementChild?.classList.contains(
        "home-activity__bubble-reveal",
      ),
    ).toBe(true);
    expect(slot.querySelector(".home-activity__bubble")).not.toBe(slot);
  }
});
it("uses the shared publication inventory for Try it out and moves the capability hash immediately after Collaboration", () => {
  expect(sidebarPages.slice(0, 3).map(([, label]) => label)).toEqual([
    "Home",
    "How it works",
    "Try it out",
  ]);
  expect(
    sidebarPages.some(
      ([href]) =>
        href === ("/pricing" as string) || href === ("/timeline" as string),
    ),
  ).toBe(false);
  const index = sidebarSections.findIndex(([id]) => id === "collaboration");
  expect(sidebarSections[index + 1]).toEqual([
    "what-weve-built",
    "What we've built",
  ]);
});

it("keeps the exact shared section labels and development-only client perspectives", () => {
  expect(sidebarSections).toEqual([
    ["hero", "Home"],
    ["technologies", "Technology"],
    ["introduction", "About"],
    ["services-overview", "Services"],
    ["conversation", "Conversation"],
    ["collaboration", "Collaboration"],
    ["what-weve-built", "What we've built"],
    ...(showClientPerspectives
      ? [["client-feedback", "Client perspectives"]]
      : []),
    ["perspective", "Our approach"],
    ["activity", "In motion"],
  ]);
});
