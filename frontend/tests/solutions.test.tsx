import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Canvas } from "../src/pages/Canvas/Canvas";
import { RequestReview } from "../src/pages/Canvas/RequestReview";
import { api, downloadReasoning } from "../src/services/api";
import { projectSolutions } from "../../shared/src/solutions";
import { createReport } from "../../backend/src/assessment";
import type { CanvasState, Session } from "../../shared/src/index";
import type { Next } from "../src/types/session";
vi.mock("../src/services/api", () => ({
  api: vi.fn(),
  downloadReasoning: vi.fn(),
  sessionHref: (id: string, view: string) => `/app/${id}/${view}`,
}));
const answers = {
  stage: "established",
  kind: "business",
  industry: "I run a small plumbing business.",
  goals:
    "I need a professional website and help setting up my business Instagram page.",
};
const session = {
  id: "s",
  planId: "p",
  revision: 1,
  plan: { archivedAt: null },
  answers: Object.entries(answers).map(([questionId, value]) => ({
    questionId,
    value,
  })),
} as Session;
const next = { readiness: { canAssess: true } } as Next;
let state: CanvasState, revision: number, fail: boolean;
const projection = () => ({
  revision: 1,
  projectRevision: revision,
  state,
  note: "",
  solutions: projectSolutions(
    createReport(answers, 1, true, [], undefined, [], {}, state),
    state,
    1,
  ),
});
function mount(s = session) {
  return render(
    <MemoryRouter>
      <Canvas
        session={s}
        next={next}
        busy={false}
        assess={vi.fn()}
        onChanged={vi.fn().mockResolvedValue(undefined)}
      />
    </MemoryRouter>,
  );
}
beforeEach(() => {
  state = { edits: {}, additions: [] };
  revision = 1;
  fail = false;
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() {
      this.removeAttribute("open");
    },
  });
  vi.mocked(api)
    .mockReset()
    .mockImplementation(async (path, method, input: any) => {
      if (method === "PUT") {
        if (fail) throw Error("Connection interrupted");
        state = input.state;
        revision++;
        return {} as never;
      }
      return projection() as never;
    });
  sessionStorage.clear();
});
afterEach(cleanup);
it("opens details separately from persistent multi-selection and survives a reload", async () => {
  const view = mount();
  const website = await screen.findByRole("button", {
    name: "View Build a website",
  });
  fireEvent.click(website);
  const dialog = screen.getByRole("dialog", { name: "Build a website" });
  expect(
    within(dialog).getByRole("button", { name: "Select this solution" }),
  ).toBeTruthy();
  expect(state.selections).toBeUndefined();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Close solution dialog" }),
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Select Build a website" }),
  );
  await screen.findByText("1 solution selected");
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "Select Set up an Instagram business page",
    }),
  );
  await screen.findByText("2 solutions selected");
  expect(
    Object.values(state.selections!).filter((s) => s.selected),
  ).toHaveLength(2);
  view.unmount();
  mount();
  await screen.findByText("2 solutions selected");
  fireEvent.click(
    screen.getByRole("button", { name: "Review selected solutions" }),
  );
  expect(
    screen.getByRole("dialog", { name: "Your selected solutions" }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Remove Build a website" }),
  );
  await waitFor(() => expect(state.selections?.website.selected).toBe(false));
});
it("records refinements and exposes material selection changes deliberately", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("checkbox", { name: "Select Build a website" }),
  );
  await screen.findByText("1 solution selected");
  fireEvent.click(screen.getByRole("button", { name: "View Build a website" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit solution" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Solution title" }), {
    target: { value: "Website with an enquiry flow" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save refinements" }));
  await screen.findByText(
    "Refinements saved. Review the updated solution before proceeding.",
  );
  expect(state.edits.website.title).toBe("Website with an enquiry flow");
  expect(state.selections?.website.selected).toBe(true);
  expect(
    screen.getByRole("button", { name: "Confirm updated selection" }),
  ).toBeTruthy();
});
it("retains an unsuccessful edit and reports the error inside the modal", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: "View Build a website" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit solution" }));
  fireEvent.change(
    screen.getByRole("textbox", {
      name: "Objective, capabilities and constraints",
    }),
    { target: { value: "Please include my service area and a contact form." } },
  );
  fail = true;
  fireEvent.click(screen.getByRole("button", { name: "Save refinements" }));
  await waitFor(() =>
    expect(
      within(screen.getByRole("dialog")).getByRole("alert").textContent,
    ).toContain("Connection interrupted"),
  );
  expect(
    (
      screen.getByRole("textbox", {
        name: "Objective, capabilities and constraints",
      }) as HTMLTextAreaElement
    ).value,
  ).toContain("service area");
});
it("provides current reasoning and a solution-context Chat handoff", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: "View Build a website" }),
  );
  expect(
    screen.getByRole("link", { name: "Discuss in Chat" }).getAttribute("href"),
  ).toContain("solution=website");
  fireEvent.click(screen.getByRole("button", { name: "Download reasoning" }));
  expect(downloadReasoning).toHaveBeenCalledWith("s", "website");
});
it("shows a useful empty state and ignores old project data on project changes", async () => {
  vi.mocked(api).mockResolvedValue({ ...projection(), solutions: [] } as never);
  mount();
  expect(
    await screen.findByRole("heading", {
      name: "A little more context first.",
    }),
  ).toBeTruthy();
  expect(screen.getByRole("link", { name: "Continue discovery" })).toBeTruthy();
});
it("keeps request notes after failure and submits exact selected revisions", async () => {
  const solution = projection().solutions[0];
  solution.selected = true;
  vi.mocked(api).mockRejectedValueOnce(Error("Please retry"));
  render(
    <MemoryRouter>
      <RequestReview
        solutions={[solution]}
        planId="p"
        sessionId="s"
        projectRevision={4}
        busy={false}
        onBusy={vi.fn()}
        onSubmitted={vi.fn().mockResolvedValue(undefined)}
        change={vi.fn()}
      />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Please help with a gradual launch." },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Request professional help" }),
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Your selections and notes are retained",
  );
  expect(sessionStorage.getItem("kailor:consultancy-draft:p")).toContain(
    "gradual launch",
  );
  expect(api).toHaveBeenCalledWith(
    "/plans/p/consultancy-requests",
    "POST",
    expect.objectContaining({
      projectRevision: 4,
      solutions: [{ id: solution.id, revision: solution.revision }],
    }),
  );
});
it("records additional capabilities as user input with an explicit priority", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: "View Build a website" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit solution" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Add a capability" }), {
    target: { value: "Service area enquiry form" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add to scope" }));
  fireEvent.change(
    screen.getByRole("combobox", {
      name: "Priority for Service area enquiry form",
    }),
    { target: { value: "essential" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Save refinements" }));
  await screen.findByText(
    "Refinements saved. Review the updated solution before proceeding.",
  );
  expect(state.edits.website.capabilities?.[0]).toMatchObject({
    label: "Service area enquiry form",
    priority: "essential",
  });
});
it("keeps archived solution details and reasoning readable while disabling mutations", async () => {
  mount({
    ...session,
    plan: { ...session.plan, archivedAt: "2026-10-17T00:00:00Z" },
  } as Session);
  const trigger = await screen.findByRole("button", {
    name: "View Build a website",
  });
  expect((trigger as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(trigger);
  expect(
    (
      screen.getByRole("button", {
        name: "Select this solution",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    (screen.getByRole("button", { name: "Edit solution" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (
      screen.getByRole("button", {
        name: "Download reasoning",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});
it("saves a pending additional capability with Save refinements", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: "View Build a website" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit solution" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Add a capability" }), {
    target: { value: "Downloadable preparation guide" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save refinements" }));
  await waitFor(() =>
    expect(state.edits.website?.capabilities?.map((c) => c.label)).toContain(
      "Downloadable preparation guide",
    ),
  );
});
