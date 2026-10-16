import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ConsultingReport } from "../src/components/ReportReader/ConsultingReport";
import { ProjectSources } from "../src/pages/Application/ProjectSources";
import { ProjectReports } from "../src/pages/Application/ProjectReports";
import { api } from "../src/services/api";
import type { Session } from "../../shared/src/index";
vi.mock("../src/services/api", () => ({
  api: vi.fn(),
  uploadSource: vi.fn(),
  downloadReport: vi.fn(),
  sessionHref: (id: string, view: string) => `/preview/${id}/${view}`,
}));
import type { Report, ConsultingDirection } from "../../shared/src/index";
afterEach(cleanup);
const direction: ConsultingDirection = {
  id: "design",
  title: "Small design services",
  summary: "One invitation using your existing tools",
  basis: ["skill"],
  why: "You described making invitations in Canva",
  requirements: ["A clear brief"],
  risks: ["Demand remains unverified"],
  costToTest: "Use your current tools",
  firstStep: "Make one sample invitation",
  validation: [
    { kind: "Ability", action: "Time a sample" },
    { kind: "Willingness to pay", action: "Offer a scoped paid trial" },
  ],
  continueWhen: "Someone agrees to a paid trial",
  stopWhen: "The work exceeds your time",
  commitment: "Manual trial",
  timeDemand: "5–8 hours per week",
  status: "hypothesis",
};
const report = {
  title: "Your opportunity exploration",
  status: "Preliminary assessment",
  createdAt: "2026-10-16T00:00:00Z",
  assessmentType: "exploration",
  sections: [],
  consulting: {
    version: 1,
    summary: "Build on your experience within your available time",
    facts: [
      {
        id: "skill",
        label: "Experience",
        value: "Canva invitations",
        quote: "I have made invitations with Canva",
        kind: "experience",
        sourceKey: "strengths",
      },
    ],
    directions: [
      direction,
      {
        ...direction,
        id: "planning",
        title: "Planning assistance",
        firstStep: "Make one event checklist",
      },
    ],
    conclusions: ["A capability basis supports a small trial"],
    hypotheses: ["Demand needs evidence"],
    unknowns: ["Who would benefit?"],
    decisions: [],
  },
} as unknown as Report;
it("selects real directions, updates the experiment and compares qualitative constraints", () => {
  render(
    <MemoryRouter>
      <ConsultingReport
        report={report}
        discussHref={(id) => `/chat?direction=${id}`}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText("Make one sample invitation")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Planning assistance/ }));
  expect(screen.getByText("Make one event checklist")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Explore this direction in Chat" })
      .getAttribute("href"),
  ).toBe("/chat?direction=planning");
  fireEvent.click(
    screen.getByRole("button", { name: "Compare possibilities" }),
  );
  expect(screen.getByRole("table").textContent).toContain("5–8 hours");
  expect(
    screen
      .getByRole("navigation", { name: "Report sections" })
      .querySelectorAll("a"),
  ).toHaveLength(4);
});

it("ignores a slow resource response after the user changes category", async () => {
  let finish!: (value: unknown) => void;
  vi.mocked(api)
    .mockReset()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve as typeof finish;
        }),
    )
    .mockResolvedValueOnce({
      sources: [
        {
          id: "note",
          title: "Current note",
          kind: "note",
          createdAt: "2026-10-16",
        },
      ],
      nextCursor: null,
    } as never);
  const session = {
    id: "s",
    planId: "p",
    plan: { archivedAt: null },
  } as Session;
  const { rerender } = render(
    <ProjectSources session={session} filter="documents" />,
  );
  rerender(<ProjectSources session={session} filter="notes" />);
  expect(
    await screen.findByRole("button", { name: "Current note" }),
  ).toBeTruthy();
  await act(async () =>
    finish({
      sources: [
        {
          id: "file",
          title: "Old document",
          kind: "text",
          createdAt: "2026-10-16",
        },
      ],
      nextCursor: null,
    }),
  );
  expect(screen.queryByRole("button", { name: "Old document" })).toBeNull();
  expect(screen.getByRole("button", { name: "Current note" })).toBeTruthy();
});
it("links library assessments to the shared reader and preserves the return filter", async () => {
  vi.mocked(api)
    .mockReset()
    .mockResolvedValue({
      reports: [
        {
          id: "report",
          title: "Saved exploration",
          summary: "A bounded pilot",
          assessmentType: "exploration",
          createdAt: "2026-10-16",
        },
      ],
      nextCursor: null,
    } as never);
  render(
    <MemoryRouter initialEntries={["/preview/s/sources?library=assessments"]}>
      <ProjectReports
        session={{ id: "s", planId: "p", revision: 1 } as Session}
        sources
      />
    </MemoryRouter>,
  );
  const link = await screen.findByRole("link", { name: "Saved exploration" });
  expect(link.getAttribute("href")).toContain(
    "analysis?report=report&from=sources&library=assessments",
  );
  expect(
    screen.queryByRole("navigation", { name: "Report sections" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Add a resource" })).toBeNull();
});

it("adapts report navigation to operational and technical assessments", () => {
  const { rerender } = render(
    <MemoryRouter>
      <ConsultingReport report={{ ...report, assessmentType: "business" }} />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "Your current setup" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "A first workflow trial" }),
  ).toBeTruthy();
  rerender(
    <MemoryRouter>
      <ConsultingReport report={{ ...report, assessmentType: "solution" }} />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "Requirements and context" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Proposed solution components" }),
  ).toBeTruthy();
});
