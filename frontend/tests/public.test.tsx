import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { PublicLayout } from "../src/components/public/PublicLayout/PublicLayout";
import Home from "../src/pages/Public/Home/Home";
import Services from "../src/pages/Public/Services/Services";
import HowItWorks from "../src/pages/Public/HowItWorks/HowItWorks";
import About from "../src/pages/Public/About/About";
import Pricing from "../src/pages/Public/Pricing/Pricing";
import Contact from "../src/pages/Public/Contact/Contact";
import { ConversationVisual } from "../src/components/public/ConversationVisual/ConversationVisual";
import { MediaSection } from "../src/components/public/MediaSection/MediaSection";
const state = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => state.reduced,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: actual.motionValue(0) }),
  };
});
beforeEach(() => {
  state.reduced = false;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function site(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}
it("provides six substantive routes and updates page metadata through navigation", () => {
  site();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "Technology that",
  );
  for (const [name, heading] of [
    ["Services", "Practical expertise."],
    ["How it works", "Understand first."],
    ["About", "Good questions."],
    ["Pricing", "Start where you are."],
    ["Contact", "What's"],
  ]) {
    fireEvent.click(
      screen
        .getByRole("navigation", { name: "Footer pages" })
        .querySelector(
          `a[href="${name === "Services" ? "/services" : name === "How it works" ? "/how-it-works" : "/" + name.toLowerCase()}"]`,
        )!,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      heading,
    );
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")?.length,
    ).toBeGreaterThan(30);
    expect(document.title).toBe("kailor");
    expect(
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content"),
    ).toBe("kailor");
  }
  expect(
    document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
  ).toBe("https://kailor.co.za/contact");
});
it("closes the mobile navigation on Escape and restores focus", () => {
  site("/about");
  const toggle = screen.getByRole("button", { name: "Open menu" });
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle);
  fireEvent.click(toggle);
  fireEvent.click(
    screen
      .getByRole("navigation", { name: "Mobile public pages" })
      .querySelector('a[href="/services"]')!,
  );
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});
it("has exactly three expandable journeys and five service destinations", () => {
  site();
  const journeys = document.querySelectorAll(".journey-tile");
  expect(journeys.length).toBe(3);
  for (const tile of journeys) {
    const summary = tile.querySelector("summary")!;
    fireEvent.click(summary);
    expect(tile.querySelector("details")?.open).toBe(true);
  }
  const panels = document.querySelectorAll(".service-panel");
  expect(panels.length).toBe(5);
  for (const panel of panels)
    expect(panel.querySelector("a")?.getAttribute("href")).toMatch(
      /^\/services#/,
    );
});
it("renders all anchor destinations on the Services page", () => {
  site("/services");
  for (const id of ["software", "ai", "automation", "cloud", "consulting"])
    expect(document.getElementById(id)).toBeTruthy();
});
it("sequences, pauses and restarts the scripted conversation without network calls", () => {
  vi.useFakeTimers();
  render(<ConversationVisual />);
  expect(document.querySelectorAll(".demo-message.is-visible").length).toBe(1);
  act(() => vi.advanceTimersByTime(2800));
  expect(document.querySelectorAll(".demo-message.is-visible").length).toBe(2);
  fireEvent.click(screen.getByRole("button", { name: "Pause conversation" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(document.querySelectorAll(".demo-message.is-visible").length).toBe(2);
  fireEvent.click(screen.getByRole("button", { name: "Restart conversation" }));
  expect(document.querySelectorAll(".demo-message.is-visible").length).toBe(1);
});
it("shows the complete conversation immediately with reduced motion", () => {
  state.reduced = true;
  render(<ConversationVisual />);
  expect(document.querySelectorAll(".demo-message.is-visible").length).toBe(4);
  expect(
    screen.queryByRole("button", { name: "Pause conversation" }),
  ).toBeNull();
});
it("uses designed fallbacks without creating source-less videos", () => {
  const { rerender } = render(<MediaSection media={{}}>Fallback</MediaSection>);
  expect(document.querySelector("video")).toBeNull();
  expect(screen.getByText("Fallback")).toBeTruthy();
  rerender(
    <MediaSection media={{ desktopMp4: "/media/work/example.mp4" }}>
      Fallback
    </MediaSection>,
  );
  expect(document.querySelector("video")?.controls).toBe(true);
  fireEvent.error(document.querySelector("video")!);
  expect(screen.getByText("Fallback")).toBeTruthy();
  expect(document.querySelector("video")).toBeNull();
});
it("keeps the hero muted, looping and inline, and pauses it outside the viewport", () => {
  let visibility: IntersectionObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        visibility = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    },
  );
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => {});
  const { unmount } = site();
  const video = document.querySelector("video")!;
  expect(video.muted).toBe(true);
  expect(video.loop).toBe(true);
  expect(video.playsInline).toBe(true);
  expect(video.querySelector("source")?.getAttribute("src")).toBe(
    "/media/hero/kailor-hero.mp4",
  );
  act(() =>
    visibility(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
  expect(play).toHaveBeenCalledOnce();
  act(() =>
    visibility(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
  expect(pause).toHaveBeenCalledOnce();
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});
it("uses the current hero fallback when reduced motion is requested", () => {
  state.reduced = true;
  site();
  expect(document.querySelector(".kailor-hero video")).toBeNull();
  expect(document.querySelector(".kailor-hero__fallback")).toBeTruthy();
});
it("keeps engagement CTAs as enquiries and labels illustrative material", () => {
  site();
  expect(
    screen.getByText("Demonstration scenarios · not client case studies"),
  ).toBeTruthy();
  expect(
    screen.getByText("Illustrative process · not performance data"),
  ).toBeTruthy();
  for (const link of document.querySelectorAll(".engagement a"))
    expect(link.getAttribute("href")).toMatch(
      /^mailto:keenosmith@kailor.co.za/,
    );
});
it("moves carousel controls to meaningful slides and supports expanding the details", () => {
  site();
  fireEvent.click(screen.getByRole("button", { name: "Next solution" }));
  expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  const summary = document.querySelector(".feature-slide details summary")!;
  fireEvent.click(summary);
  expect(
    document.querySelector<HTMLDetailsElement>(".feature-slide details")?.open,
  ).toBe(true);
});
