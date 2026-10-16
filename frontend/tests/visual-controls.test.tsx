import { ErrorBox } from "../src/components/ErrorBox/ErrorBox";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Conversation } from "../src/pages/Conversation/Conversation";
import { Discovery } from "../src/pages/Discovery/Discovery";
import { ConfirmDialog } from "../src/components/ConfirmDialog/ConfirmDialog";
import { SessionPage } from "../src/pages/SessionPage/SessionPage";
import { api, uploadSource } from "../src/services/api";
import type { Session, DiscoveryPlan } from "../../shared/src/index";
vi.mock("../src/services/api", () => ({
  api: vi.fn(),
  uploadSource: vi.fn(),
  sessionHref: (id: string, view: string) => `/preview/${id}/${view}`,
}));
const session = {
  id: "visual-session",
  planId: "visual-project",
  revision: 1,
  knowledgeRevision: 1,
  answers: [],
  evidence: [],
  messages: [],
  planProposals: [],
  plan: { title: "Visual project", archivedAt: null },
} as unknown as Session;
const stage = {
  id: "stage",
  title: "Where are you right now?",
  type: "single",
  options: [{ value: "established", label: "I own a business" }],
};
const text = {
  id: "industry",
  title: "Tell us a little about what you do.",
  type: "text",
  hint: "Your activity in your own words.",
};
const next = {
  revision: 1,
  question: stage,
  active: [stage, text],
  context: { pending: [] },
  suggestedPrompts: [],
  readiness: { canAssess: false, reasons: [], uncertainties: [] },
  completion: { state: "in_progress" },
} as unknown as DiscoveryPlan;
beforeEach(() => {
  vi.mocked(api).mockReset();
  vi.mocked(uploadSource).mockReset();
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("keeps empty-clear feedback outside the transcript, directly above the composer", () => {
  render(
    <MemoryRouter>
      <Conversation
        session={session}
        next={next}
        busy={false}
        ready={false}
        act={vi.fn()}
        assess={vi.fn()}
      />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Clear conversation" }));
  const notice = screen.getByRole("status");
  expect(notice.textContent).toBe("There’s no conversation to clear.");
  expect(notice.closest(".chat-history")).toBeNull();
  expect(notice.nextElementSibling?.className).toBe("chat-form");
});
it("adds a document to the current project's Sources and reports success", async () => {
  vi.mocked(uploadSource).mockResolvedValue({ id: "source" });
  render(
    <MemoryRouter>
      <Conversation
        session={session}
        next={next}
        busy={false}
        ready={false}
        act={vi.fn()}
        assess={vi.fn()}
      />
    </MemoryRouter>,
  );
  const file = new File(["Project note"], "notes.txt", { type: "text/plain" });
  fireEvent.change(screen.getByLabelText("Project documents"), {
    target: { files: [file] },
  });
  await waitFor(() =>
    expect(uploadSource).toHaveBeenCalledWith("visual-project", file),
  );
  expect((await screen.findByRole("status")).textContent).toContain(
    "Added notes.txt",
  );
});
it("reports document errors without losing the Chat draft", async () => {
  vi.mocked(uploadSource).mockRejectedValue(
    new Error("Could not extract this file."),
  );
  render(
    <MemoryRouter>
      <Conversation
        session={session}
        next={next}
        busy={false}
        ready={false}
        act={vi.fn()}
        assess={vi.fn()}
      />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Your message" }), {
    target: { value: "My unsent idea" },
  });
  fireEvent.change(screen.getByLabelText("Project documents"), {
    target: { files: [new File(["bad"], "bad.txt")] },
  });
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain(
      "Could not extract",
    ),
  );
  expect(
    (
      screen.getByRole("textbox", {
        name: "Your message",
      }) as HTMLTextAreaElement
    ).value,
  ).toBe("My unsent idea");
});
it("omits restart at the first question and offers it only after progress", () => {
  const restart = vi.fn();
  const { rerender } = render(
    <MemoryRouter>
      <Discovery
        session={session}
        next={next}
        busy={false}
        ready={false}
        act={vi.fn()}
        assess={vi.fn()}
        restart={restart}
      />
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole("button", { name: "Start from beginning" }),
  ).toBeNull();
  rerender(
    <MemoryRouter>
      <Discovery
        session={{
          ...session,
          answers: [
            { questionId: "stage", value: "established" },
          ] as Session["answers"],
        }}
        next={{ ...next, question: text } as DiscoveryPlan}
        busy={false}
        ready={false}
        act={vi.fn()}
        assess={vi.fn()}
        restart={restart}
      />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Start from beginning" }));
  expect(restart).toHaveBeenCalledOnce();
});
it("traps modal focus, cancels with Escape/backdrop and prevents dismissal while busy", () => {
  const onClose = vi.fn(),
    onConfirm = vi.fn();
  const { rerender } = render(
    <ConfirmDialog
      title="Begin again?"
      confirmLabel="Start again"
      busy={false}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <p>Saved reports remain.</p>
    </ConfirmDialog>,
  );
  const cancel = screen.getByRole("button", { name: "Cancel" }),
    confirm = screen.getByRole("button", { name: "Start again" });
  expect(document.activeElement).toBe(cancel);
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(confirm);
  fireEvent.keyDown(document, { key: "Tab" });
  expect(document.activeElement).toBe(cancel);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.click(document.querySelector(".confirm-dialog-backdrop")!);
  expect(onClose).toHaveBeenCalledTimes(2);
  fireEvent.click(confirm);
  expect(onConfirm).toHaveBeenCalledOnce();
  rerender(
    <ConfirmDialog
      title="Begin again?"
      confirmLabel="Start again"
      busy={true}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <p>Saved reports remain.</p>
    </ConfirmDialog>,
  );
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(2);
});
it("requires the clean restart modal before submitting a reset and retains work on cancel", async () => {
  const saved = {
    ...session,
    answers: [
      { questionId: "stage", value: "established" },
    ] as Session["answers"],
  };
  vi.mocked(api).mockImplementation(async (path) =>
    path.endsWith("/next")
      ? ({ ...next, question: text } as never)
      : path.endsWith("report-status")
        ? Promise.reject(new Error("No report"))
        : (saved as never),
  );
  render(
    <MemoryRouter>
      <SessionPage
        sessionId={session.id}
        activeView="discovery"
        onSession={vi.fn()}
        initialMessage=""
        onInitialMessageConsumed={vi.fn()}
        onNewConversation={vi.fn()}
        onProjectChange={vi.fn()}
      />
    </MemoryRouter>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Start from beginning" }),
  );
  expect(
    screen.getByRole("dialog", { name: "Begin Discovery again?" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(vi.mocked(api).mock.calls.some((call) => call[1] === "POST")).toBe(
    false,
  );
  fireEvent.click(screen.getByRole("button", { name: "Start from beginning" }));
  fireEvent.click(
    screen.getByRole("dialog").querySelector(".confirm-dialog-submit")!,
  );
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      `/sessions/${session.id}/discovery/restart`,
      "POST",
      { revision: 1 },
    ),
  );
});

it("dismisses empty-clear feedback after three seconds and restarts its timer on another click", () => {
  vi.useFakeTimers();
  render(
    <MemoryRouter>
      <Conversation
        session={session}
        next={next}
        busy={false}
        ready={false}
        act={vi.fn()}
        assess={vi.fn()}
      />
    </MemoryRouter>,
  );
  const clear = screen.getByRole("button", { name: "Clear conversation" });
  fireEvent.click(clear);
  act(() => vi.advanceTimersByTime(2000));
  fireEvent.click(clear);
  act(() => vi.advanceTimersByTime(2999));
  expect(screen.getByRole("status").textContent).toBe(
    "There’s no conversation to clear.",
  );
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByText("There’s no conversation to clear.")).toBeNull();
});

it("dismisses an error bubble and shows a later message", () => {
  const { rerender } = render(
    <ErrorBox error="The service could not be reached." />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Dismiss message" }));
  expect(screen.queryByRole("alert")).toBeNull();
  rerender(<ErrorBox error="Please try again." />);
  expect(screen.getByRole("alert").textContent).toBe("Please try again.");
});

it("keeps long drafts in a single-line input and preserves them through composition and failed sends", async () => {
  const actRequest = vi.fn(async () => false);
  render(
    <MemoryRouter>
      <Conversation
        session={session}
        next={next}
        busy={false}
        ready={true}
        act={actRequest}
        assess={vi.fn()}
      />
    </MemoryRouter>,
  );
  const input = screen.getByRole("textbox", {
    name: "Your message",
  }) as HTMLInputElement;
  expect(input.tagName).toBe("INPUT");
  expect(input.type).toBe("text");
  const long = "A detailed idea with constraints. ".repeat(100);
  fireEvent.change(input, { target: { value: long } });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true, keyCode: 229 });
  expect(actRequest).not.toHaveBeenCalled();
  fireEvent.submit(input.closest("form")!);
  await waitFor(() => expect(input.value).toBe(long));
  expect(actRequest).toHaveBeenCalledOnce();
  const beyondLimit = "x".repeat(4200);
  fireEvent.change(input, { target: { value: beyondLimit } });
  fireEvent.submit(input.closest("form")!);
  expect(input.value).toBe(beyondLimit);
  expect(screen.getByRole("status").textContent).toContain("text is kept");
  expect(actRequest).toHaveBeenCalledOnce();
});

it("submits the entire long input without clipping it to the visible line", async () => {
  vi.useFakeTimers();
  vi.mocked(api).mockResolvedValue({
    provider: "mock-development",
    fallbackReason: "remote_disabled",
  });
  const run = vi.fn(async (fn: () => Promise<unknown>) => {
    await fn();
    return true;
  });
  render(
    <MemoryRouter>
      <Conversation
        session={session}
        next={next}
        busy={false}
        ready={true}
        act={run}
        assess={vi.fn()}
      />
    </MemoryRouter>,
  );
  const long = "A bounded invitation pilot using existing resources. ".repeat(
    60,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Your message" }), {
    target: { value: long },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  expect(api).toHaveBeenCalledWith(`/sessions/${session.id}/chat`, "POST", {
    revision: session.revision,
    message: long,
    mode: "conversation",
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(
    (screen.getByRole("textbox", { name: "Your message" }) as HTMLInputElement)
      .value,
  ).toBe("");
});
it("gives Discovery completion separate assessment, continuation, new-project and Chat actions", () => {
  render(
    <MemoryRouter>
      <Discovery
        session={session}
        next={{
          ...next,
          question: null,
          readiness: { ...next.readiness, canAssess: true },
        }}
        busy={false}
        act={vi.fn()}
        assess={vi.fn()}
        ready={false}
        restart={vi.fn()}
        onNewProject={vi.fn()}
      />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "We have enough to get started." }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Prepare assessment" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Continue discovery" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Start a new project" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Discuss your project in Chat" })
      .className,
  ).toContain("conversation-link");
});
