import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { App } from "../src/App";
import { api } from "../src/services/api";
vi.mock("../src/services/api", () => ({
  api: vi.fn(),
  sessionHref: (id: string, view: string) => `/app/${id}/${view}`,
}));
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  vi.mocked(api).mockRejectedValue(new Error("Unauthenticated"));
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  HTMLElement.prototype.animate = vi.fn(
    () => ({ cancel: vi.fn() }) as unknown as Animation,
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("loads the actual lazy public route without an account API request or app footer", async () => {
  render(
    <MemoryRouter initialEntries={["/contact"]}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
  expect(document.querySelector(".public-site")).toBeTruthy();
  expect(document.querySelector(".application-workspace")).toBeNull();
  expect(document.querySelectorAll("footer").length).toBe(1);
  expect(api).not.toHaveBeenCalled();
});
it("preserves protected workspace access and sign-in return path", async () => {
  render(
    <MemoryRouter initialEntries={["/app/chat"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("button", { name: "Sign in", exact: true }),
  ).toBeTruthy();
  expect(api).toHaveBeenCalledWith("/auth/me");
  expect(document.querySelector(".public-site")).toBeNull();
  expect(
    document.querySelector('meta[name="robots"]')?.getAttribute("content"),
  ).toBe("noindex, nofollow");
});

it("treats trailing-slash public paths as public with one footer", async () => {
  render(
    <MemoryRouter initialEntries={["/contact/"]}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
  expect(document.querySelector(".public-shell")).toBeTruthy();
  expect(document.querySelectorAll("footer").length).toBe(1);
  expect(api).not.toHaveBeenCalled();
  expect(
    document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
  ).toBe("https://kailor.co.za/contact");
});
