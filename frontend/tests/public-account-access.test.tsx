import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
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
    expect(screen.getByRole("status").textContent).toContain(
      "Account access will open soon.",
    );
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
      screen.getByRole("link", { name: "Contact kailor" }).getAttribute("href"),
    ).toBe("/contact");
    expect(
      screen
        .getByRole("link", { name: signup ? "Sign in" : "Create an account" })
        .getAttribute("href"),
    ).toBe(signup ? "/sign-in" : "/create-account");
  },
);
