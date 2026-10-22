import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
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
  expect(screen.queryByText("Continue without account")).toBeNull();
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
      .getByRole("link", { name: "Create account", exact: true })
      .getAttribute("href"),
  ).toContain("returnTo=%2Fapp%2Fchat");
  await act(async () => reject!(new Error("Please try again.")));
  expect(screen.getByText("Please try again.")).toBeTruthy();
});
