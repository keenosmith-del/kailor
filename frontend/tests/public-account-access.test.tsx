import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router";
import { AccountAccess } from "../src/components/public/AccountAccess/AccountAccess";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it.each([false, true])(
  "shows the preserved account design without usable authentication (signup=%s)",
  (signup) => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(
      <MemoryRouter>
        <AccountAccess signup={signup} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      signup ? "Create account" : "Welcome back",
    );
    expect(screen.queryByText(/getting things ready/i)).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Continue without account" }),
    ).toBeNull();
    expect(document.querySelectorAll("input").length).toBe(signup ? 4 : 2);
    for (const input of document.querySelectorAll("input"))
      expect(input.disabled).toBe(true);
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      ".auth-container button",
    )) {
      expect(button.disabled).toBe(true);
      fireEvent.click(button);
    }
    expect(document.querySelector("form")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("link", { name: signup ? "Sign in" : "Create an account" })
        .getAttribute("href"),
    ).toBe(signup ? "/sign-in" : "/create-account");
  },
);

function BrowserBack() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Browser back</button>;
}
it.each([false, true])(
  "returns home after switching account pages (browser back=%s)",
  (browserBack) => {
    render(
      <MemoryRouter initialEntries={["/", "/sign-in"]}>
        <BrowserBack />
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/sign-in" element={<AccountAccess />} />
          <Route path="/create-account" element={<AccountAccess signup />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
    fireEvent.click(screen.getByRole("link", { name: "Sign in" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: browserBack ? "Browser back" : "Back",
        exact: true,
      }),
    );
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy();
  },
);
