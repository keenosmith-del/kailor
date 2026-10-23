import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { InternalNavigation } from "../src/components/public/PageBack/PageBack";
import { Auth } from "../src/pages/Auth/Auth";
import { api } from "../src/services/api";
vi.mock("../src/services/api", () => ({ api: vi.fn() }));
vi.mock("motion/react", async (original) => ({
  ...(await original<typeof import("motion/react")>()),
  useReducedMotion: () => true,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
beforeEach(() => {
  vi.mocked(api).mockResolvedValue({
    registration: "closed",
    guestAccess: false,
  });
});
it("keeps a restricted create-account route accessible without presenting a registration or guest bypass", async () => {
  render(
    <MemoryRouter>
      <Auth signup onLogin={vi.fn()} />
    </MemoryRouter>,
  );
  expect(
    await screen.findByText(/Account creation is restricted/),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Create account", exact: true }),
  ).toBeNull();
  expect(
    screen
      .getByRole("button", { name: "Continue without account" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(
    screen.getByRole("button", { name: "Back", exact: true }),
  ).toBeTruthy();
});
it("invitation mode includes the code and keeps validation errors visible", async () => {
  vi.mocked(api).mockResolvedValue({
    registration: "invite",
    guestAccess: false,
  });
  render(
    <MemoryRouter>
      <Auth signup onLogin={vi.fn()} />
    </MemoryRouter>,
  );
  await screen.findByLabelText("Invitation code");
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), {
    target: { value: "long-password-only" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "another-password" },
  });
  fireEvent.submit(document.querySelector("form")!);
  expect(screen.getByText("Your passwords do not match.")).toBeTruthy();
  expect(api).toHaveBeenCalledTimes(1);
});
it("prevents duplicate sign-in requests and preserves only safe return destinations", async () => {
  let reject: (error: Error) => void;
  vi.mocked(api).mockImplementation(async (path) =>
    path === "/auth/policy"
      ? ({ registration: "closed", guestAccess: false } as never)
      : new Promise((_resolve, fail) => {
          reject = fail;
        }),
  );
  render(
    <MemoryRouter initialEntries={["/sign-in?returnTo=https://example.com"]}>
      <Auth onLogin={vi.fn()} />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), {
    target: { value: "test-only-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(
    screen.getByLabelText("Password", { exact: true }).getAttribute("type"),
  ).toBe("text");
  fireEvent.submit(document.querySelector("form")!);
  fireEvent.submit(document.querySelector("form")!);
  expect(
    vi.mocked(api).mock.calls.filter(([path]) => path === "/auth/login"),
  ).toHaveLength(1);
  expect(
    screen
      .getByRole("link", { name: "Create an account", exact: true })
      .getAttribute("href"),
  ).toContain("returnTo=%2Fapp%2Fchat");
  await act(async () => reject!(new Error("Please try again.")));
  expect(screen.getByText("Please try again.")).toBeTruthy();
});

it("restores the profile and GitHub icons and matching mascot wordmark", async () => {
  render(
    <MemoryRouter>
      <Auth onLogin={vi.fn()} />
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { name: "Welcome back" });
  expect(
    screen
      .getByRole("button", { name: "Sign in", exact: true })
      .querySelector("img")
      ?.getAttribute("src"),
  ).toBe("/svgs/profile.svg");
  const github = screen.getByRole("button", { name: "Continue with GitHub" });
  expect(github.querySelector("img")?.getAttribute("src")).toBe(
    "/technology/github.svg",
  );
  expect(github.hasAttribute("disabled")).toBe(true);
  expect(
    screen
      .getByRole("link", { name: "kailor home" })
      .querySelector("img")
      ?.getAttribute("src"),
  ).toBe("/mascot-head.png");
});

it("keeps guest entry disabled even when the API reports guest access enabled", async () => {
  vi.mocked(api).mockResolvedValue({
    registration: "public",
    guestAccess: true,
  });
  render(
    <MemoryRouter>
      <Auth onLogin={vi.fn()} />
    </MemoryRouter>,
  );
  await act(async () => {});
  const guest = screen.getByRole("button", {
    name: "Continue without account",
  });
  expect(guest.hasAttribute("disabled")).toBe(true);
  fireEvent.click(guest);
  expect(
    vi.mocked(api).mock.calls.some(([, method]) => method === "POST"),
  ).toBe(false);
  expect(screen.getByText("New here?")).toBeTruthy();
});
it.each(["/sign-in", "/create-account"])(
  "returns Home after switching forms from %s",
  async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <InternalNavigation>
          <Routes>
            <Route path="/" element={<h1>Home</h1>} />
            <Route path="/sign-in" element={<Auth onLogin={vi.fn()} />} />
            <Route
              path="/create-account"
              element={<Auth signup onLogin={vi.fn()} />}
            />
          </Routes>
        </InternalNavigation>
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole("link", {
        name: path === "/sign-in" ? "Create an account" : "Sign in",
        exact: true,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Back", exact: true }));
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy();
  },
);

it.each([false, true])(
  "uses inline validation without native prompts (signup=%s)",
  async (signup) => {
    vi.mocked(api).mockResolvedValue({
      registration: "invite",
      guestAccess: false,
    });
    render(
      <MemoryRouter>
        <Auth signup={signup} onLogin={vi.fn()} />
      </MemoryRouter>,
    );
    await screen.findByLabelText(signup ? "Full name" : "Email");
    const form = document.querySelector("form")!;
    expect(form.noValidate).toBe(true);
    expect(form.querySelectorAll("[required]")).toHaveLength(0);
    fireEvent.submit(form);
    expect(screen.getByText("Please enter your email address.")).toBeTruthy();
    expect(screen.getByText("Please enter your password.")).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByLabelText(signup ? "Full name" : "Email"),
    );
    expect(
      vi.mocked(api).mock.calls.filter(([, method]) => method === "POST"),
    ).toHaveLength(0);
    if (signup) {
      expect(screen.getByText("Please enter your full name.")).toBeTruthy();
      expect(screen.getByText("Please confirm your password.")).toBeTruthy();
      expect(
        screen.getByText("Please enter your invitation code."),
      ).toBeTruthy();
      fireEvent.change(screen.getByLabelText("Password", { exact: true }), {
        target: { value: "short" },
      });
      fireEvent.submit(form);
      expect(
        screen.getByText("Use at least 12 characters for your password."),
      ).toBeTruthy();
    }
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "invalid-email" },
    });
    fireEvent.submit(form);
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
  },
);
