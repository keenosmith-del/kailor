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
import Timeline from "../src/pages/Public/Timeline/Timeline";
import Careers from "../src/pages/Public/Careers/Careers";
import { InternalNavigation } from "../src/components/public/PageBack/PageBack";
import {
  CookiePreferences,
  COOKIE_PREFERENCE_KEY,
} from "../src/components/public/CookiePreferences/CookiePreferences";
import { within } from "@testing-library/react";
import { sidebarSections } from "../src/components/public/navigation";
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
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
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
      <InternalNavigation>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/services" element={<Services />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
          </Route>
        </Routes>
      </InternalNavigation>
    </MemoryRouter>,
  );
}
it("renders the launch homepage, unique portraits and only real section destinations", () => {
  site();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "Technology that",
  );
  expect(document.getElementById("work")).toBeNull();
  expect(document.getElementById("consultants")).toBeNull();
  expect(document.getElementById("client-feedback")).toBeTruthy();
  for (const [id] of sidebarSections)
    expect(document.getElementById(id)).toBeTruthy();
  const portraits = Array.from(
    document.querySelectorAll<HTMLImageElement>('img[src^="/clients/"]'),
  ).map((image) => image.src);
  expect(new Set(portraits).size).toBe(portraits.length);
  expect(document.querySelectorAll(".service-panel")).toHaveLength(4);
  expect(
    document.querySelector(".stacked-panels")?.closest(".section-reveal"),
  ).toBeNull();
});
it("provides the exact Pages list, genuinely disabled items and collapsible inert section links", () => {
  site();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  const group = nav.querySelector(".public-mobile-nav__group")!;
  expect(
    Array.from(group.querySelectorAll("a, span")).map(
      (item) => item.textContent,
    ),
  ).toEqual([
    "Home",
    "How it works",
    "Our Work",
    "Our Team",
    "Timeline",
    "Pricing",
    "Careers",
    "Contact",
  ]);
  expect(group.querySelectorAll("[aria-disabled=true]")).toHaveLength(2);
  expect(group.querySelector('[href="/work"]')).toBeNull();
  expect(screen.queryByText("Coming later")).toBeNull();
  const button = within(nav).getByRole("button", { name: "On the homepage" });
  fireEvent.click(button);
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(
    document.getElementById("homepage-section-links")?.hasAttribute("inert"),
  ).toBe(true);
  fireEvent.click(button);
  expect(button.getAttribute("aria-expanded")).toBe("true");
});
it("dismisses with Escape, restores focus and opens the shared conversation from the sidebar", () => {
  site();
  const toggle = screen.getByRole("button", { name: "Open menu" });
  fireEvent.click(toggle);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(document.activeElement).toBe(toggle);
  fireEvent.click(toggle);
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  expect(
    within(nav)
      .getByRole("link", { name: "Create account" })
      .querySelector("img")
      ?.getAttribute("src"),
  ).toBe("/svgs/profile.svg");
  fireEvent.click(
    within(nav).getByRole("button", { name: "Start conversation" }),
  );
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(screen.getByRole("dialog", { name: "Let's chat" })).toBeTruthy();
});
it("routes to minimal shells, sets noindex and provides safe Back navigation", () => {
  site();
  for (const [path, title] of [
    ["how-it-works", "How it works"],
    ["timeline", "Timeline"],
    ["pricing", "Pricing"],
    ["careers", "Careers"],
    ["contact", "Contact"],
  ]) {
    fireEvent.click(
      document.querySelector(`.public-footer a[href="/${path}"]`)!,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(title);
    expect(document.title).toBe(`${title} | kailor`);
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex, nofollow");
    fireEvent.click(screen.getByRole("button", { name: "Back", exact: true }));
    expect(document.getElementById("hero")).toBeTruthy();
  }
});
it("Contact refresh has a functional shared conversation action and safe Home fallback", () => {
  site("/contact");
  fireEvent.click(
    screen.getByRole("button", { name: "Start conversation", exact: true }),
  );
  expect(screen.getByRole("dialog", { name: "Let's chat" })).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Close conversation form" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Back", exact: true }));
  expect(document.getElementById("hero")).toBeTruthy();
});
it("loads initial section hashes after the page commits", async () => {
  site("/#collaboration");
  await act(
    async () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  expect(
    document.getElementById("collaboration")?.scrollIntoView,
  ).toHaveBeenCalled();
});
it("persists versioned essential-only cookie preferences and restores focus", () => {
  render(
    <MemoryRouter>
      <CookiePreferences />
    </MemoryRouter>,
  );
  const trigger = screen.getByRole("button", { name: "Cookies", exact: true });
  fireEvent.click(trigger);
  expect(
    screen.getByRole("dialog", { name: "Cookie preferences" }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Save essential-only preferences" }),
  );
  expect(
    JSON.parse(localStorage.getItem(COOKIE_PREFERENCE_KEY)!),
  ).toMatchObject({ version: 1, essential: true, optional: false });
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);
  expect(
    screen.getByText(/Your essential-only preference is saved/),
  ).toBeTruthy();
});
it("keeps content visible and disables video autoplay in reduced motion", () => {
  state.reduced = true;
  site();
  expect(
    document.querySelector<HTMLVideoElement>(".service-art--cloud video")
      ?.autoplay,
  ).toBe(false);
  expect(
    document.querySelectorAll(".kailor-chat__message").length,
  ).toBeGreaterThan(0);
});
it("keeps media fallbacks for broken files", () => {
  render(
    <MediaSection media={{ desktopMp4: "/missing.mp4" }}>
      Fallback
    </MediaSection>,
  );
  fireEvent.error(document.querySelector("video")!);
  expect(screen.getByText("Fallback")).toBeTruthy();
  expect(document.querySelector("video")).toBeNull();
});
