import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { ApplicationSidebar } from "../src/components/ApplicationSidebar/ApplicationSidebar";
import { GuestJourneyEntry } from "../src/pages/Application/GuestJourneyEntry";
import { api } from "../src/services/api";
import type { PlanItem, Session } from "../../shared/src/index";
vi.mock("../src/services/api", () => ({
  api: vi.fn(),
  sessionHref: (id: string, view: string) => `/preview/${id}/${view}`,
}));
const mockApi = vi.mocked(api);
const project = {
  id: "project-a",
  title: "Nail tech",
  lastSessionId: "session-a",
  revision: 2,
} as PlanItem;
const other = {
  ...project,
  id: "project-b",
  title: "Another project",
  lastSessionId: "session-b",
};
function Location() {
  return <output aria-label="Location">{useLocation().pathname}</output>;
}
function sidebar(guest = true) {
  const onNewConversation = vi.fn().mockResolvedValue(undefined),
    onSelect = vi.fn(),
    onLogout = vi.fn(),
    onNew = vi.fn(),
    onExitGuest = vi.fn();
  render(
    <MemoryRouter initialEntries={["/preview/session-a/chat"]}>
      <div className="application-body">
        <button>Background</button>
      </div>
      <ApplicationSidebar
        session={{ id: "session-a", planId: project.id } as Session}
        onNewConversation={onNewConversation}
        account={
          guest
            ? null
            : { email: "owner@test.local", name: "Owner", role: "member" }
        }
        guest={guest}
        view="chat"
        title="Nail tech"
        projects={[project, other]}
        activeId={project.id}
        busy={false}
        more={false}
        href={(view) => `/preview/session-a/${view}`}
        onSelect={onSelect}
        onRename={vi.fn().mockResolvedValue(undefined)}
        onNew={onNew}
        onMore={vi.fn()}
        onExitGuest={onExitGuest}
        onLogout={onLogout}
      />
      <Location />
    </MemoryRouter>,
  );
  return { onNewConversation, onSelect, onLogout, onNew, onExitGuest };
}
beforeEach(() => {
  // jsdom has no layout: treat mounted, non-hidden controls as visible for focus wrapping.
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
    function (this: HTMLElement) {
      return (this.closest("[hidden]")
        ? []
        : [{ width: 44 }]) as unknown as DOMRectList;
    },
  );
  mockApi.mockImplementation(async (path) => {
    if (path === "/plans") return { selection: { revision: 4 } } as never;
    if (path.endsWith("/sessions"))
      return {
        sessions: [
          {
            id: path.includes("project-b") ? "session-b" : "session-a",
            updatedAt: "2026-10-15T12:00:00Z",
          },
        ],
        nextCursor: null,
      } as never;
    return {} as never;
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("uses one navigation, toggles the same ellipsis, dismisses with Escape and backdrop, and restores focus", () => {
  sidebar();
  const trigger = screen.getByRole("button", { name: "Open navigation" });
  expect(
    screen.getAllByRole("navigation", { name: "Application pages" }),
  ).toHaveLength(1);
  expect(
    screen.getByRole("link", { name: "Chat" }).getAttribute("aria-current"),
  ).toBe("page");
  fireEvent.click(trigger);
  expect(screen.getByRole("button", { name: "Close navigation" })).toBe(
    trigger,
  );
  expect(document.querySelector<HTMLElement>(".application-body")?.inert).toBe(
    true,
  );
  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(document.activeElement).toBe(trigger);
  expect(document.querySelector<HTMLElement>(".application-body")?.inert).toBe(
    false,
  );
  fireEvent.click(trigger);
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss navigation backdrop" }),
  );
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});
it("traps keyboard focus and consolidates guest identity, Settings and Account without sign out", () => {
  sidebar();
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  const trigger = screen.getByRole("button", { name: "Close navigation" });
  const identity = screen.getByRole("button", {
    name: "Guest, account options",
  });
  trigger.focus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(identity);
  fireEvent.keyDown(document, { key: "Tab" });
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(identity);
  expect(
    screen.getByRole("link", { name: "Settings" }).getAttribute("href"),
  ).toContain("/settings");
  expect(screen.getByRole("link", { name: "Account" })).toBeTruthy();
  expect(screen.queryByText("Sign out")).toBeNull();
  expect(screen.queryByText("Sign in")).toBeNull();
});
it("shows the authenticated identity and preserves sign out", () => {
  const { onLogout } = sidebar(false);
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Owner, account options" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(onLogout).toHaveBeenCalledOnce();
});
it("starts collapsed, expands projects independently, selects the correct conversation and creates within the requested project", async () => {
  const { onNewConversation } = sidebar();
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  expect(
    screen.queryByRole("navigation", { name: "Project conversations" }),
  ).toBeNull();
  expect(
    screen
      .getByRole("button", { name: "Open project Nail tech" })
      .getAttribute("aria-current"),
  ).toBe("true");
  fireEvent.click(
    screen.getByRole("button", {
      name: "Expand conversations for Another project",
    }),
  );
  await screen.findByText("Conversation");
  fireEvent.click(
    screen.getByRole("button", { name: "New conversation in Another project" }),
  );
  await waitFor(() =>
    expect(onNewConversation).toHaveBeenCalledWith("project-b"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  fireEvent.click(await screen.findByRole("button", { name: /^Conversation/ }));
  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith("/plans/project-b/select", "POST", {
      revision: 4,
      sessionId: "session-b",
    }),
  );
  expect(screen.getByLabelText("Location").textContent).toBe(
    "/preview/session-b/chat",
  );
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Expand conversations for Nail tech" }),
  );
  expect(
    (
      await screen.findByRole("button", { name: /Active conversation/ })
    ).getAttribute("aria-current"),
  ).toBe("true");
  fireEvent.click(
    screen.getByRole("button", {
      name: "Collapse conversations for Nail tech",
    }),
  );
  expect(
    screen.queryByRole("button", { name: /Active conversation/ }),
  ).toBeNull();
});
it("preserves project selection and the accessible full title", () => {
  const { onSelect } = sidebar();
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  const button = screen.getByRole("button", {
    name: "Open project Another project",
  });
  expect(button.title).toBe("Another project");
  fireEvent.click(button);
  expect(onSelect).toHaveBeenCalledWith(other);
});
function entry() {
  mockApi.mockImplementation(async (path) => {
    if (path === "/guest/journeys")
      return { current: project, expiresAt: "2026-10-17T12:00:00Z" } as never;
    return { plans: [], nextCursor: null } as never;
  });
  render(
    <MemoryRouter initialEntries={["/preview/discovery"]}>
      <GuestJourneyEntry />
      <Location />
    </MemoryRouter>,
  );
}
it("distinguishes current Chat and Discovery; cancelling or Escape does not replace a project", async () => {
  entry();
  expect(await screen.findByRole("button", { name: "Open Chat" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Start discovery" })).toBeTruthy();
  const button = screen.getByRole("button", {
    name: /Start a new guest journey/,
  });
  fireEvent.click(button);
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Cancel" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(document.activeElement).toBe(button);
  fireEvent.click(button);
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(mockApi.mock.calls.some((call) => call[1] === "POST")).toBe(false);
});
it("requires explicit archive confirmation and navigates to the empty journey", async () => {
  entry();
  fireEvent.click(
    await screen.findByRole("button", { name: /Start a new guest journey/ }),
  );
  mockApi.mockResolvedValueOnce({ sessionId: "fresh-session" });
  fireEvent.click(
    screen.getByRole("button", { name: "Archive and start fresh" }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe(
      "/preview/fresh-session/discovery",
    ),
  );
  expect(mockApi).toHaveBeenCalledWith(
    "/guest/journeys",
    "POST",
    expect.objectContaining({ planId: project.id, revision: 2, consent: true }),
  );
});
it("creates a first guest journey only after Start discovery", async () => {
  mockApi.mockResolvedValueOnce({ current: null, expiresAt: null });
  render(
    <MemoryRouter>
      <GuestJourneyEntry />
      <Location />
    </MemoryRouter>,
  );
  const button = await screen.findByRole("button", { name: "Start discovery" });
  expect(mockApi.mock.calls.some((call) => call[1] === "POST")).toBe(false);
  mockApi.mockResolvedValueOnce({ id: "first-session" });
  fireEvent.click(button);
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe(
      "/preview/first-session/discovery",
    ),
  );
});

it("places conversation creation beside project actions and keeps a new-project control", () => {
  const { onNew } = sidebar(false);
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  expect(
    screen.queryByRole("button", { name: "New conversation", exact: true }),
  ).toBeNull();
  const action = screen.getByRole("button", {
    name: "New conversation in Nail tech",
  });
  expect(action.previousElementSibling?.getAttribute("aria-label")).toBe(
    "Rename Nail tech",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "New project", exact: true }),
  );
  expect(onNew).toHaveBeenCalledOnce();
});
it("routes the guest new-project plus to safe journey choices", () => {
  sidebar();
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  fireEvent.click(
    screen.getByRole("button", { name: "New project", exact: true }),
  );
  expect(screen.getByLabelText("Location").textContent).toBe(
    "/preview/discovery",
  );
});

it("offers a guest exit action without invoking account sign out", () => {
  const { onExitGuest, onLogout } = sidebar();
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Guest, account options" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Exit guest session" }));
  expect(onExitGuest).toHaveBeenCalledOnce();
  expect(onLogout).not.toHaveBeenCalled();
});

it("opens Coffee chat within the current project without creating another project", async () => {
  entry();
  fireEvent.click(await screen.findByRole("button", { name: "Open Chat" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe(
      "/preview/session-a/chat",
    ),
  );
  expect(mockApi.mock.calls.some((call) => call[1] === "POST")).toBe(false);
});
