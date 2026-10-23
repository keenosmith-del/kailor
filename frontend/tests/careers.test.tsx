import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import Careers from "../src/pages/Public/Careers/Careers";
import { ConversationProvider } from "../src/components/public/ConversationModal/ConversationModal";
import {
  CV_MAX_BYTES,
  validateCareer,
  emptyCareerFields,
} from "../../shared/src/careers";
vi.mock("motion/react", async (original) => {
  const actual = await original<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => true,
    useScroll: () => ({ scrollYProgress: actual.motionValue(0.5) }),
  };
});
const fetcher = vi.fn(),
  writeText = vi.fn();
const policy = {
  available: true,
  processor: "Test private processor",
  region: "Test region",
  retentionDays: 30,
};
beforeEach(() => {
  fetcher.mockReset().mockResolvedValue({ ok: true, json: async () => policy });
  vi.stubGlobal("fetch", fetcher);
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function page() {
  render(
    <MemoryRouter initialEntries={["/careers"]}>
      <ConversationProvider>
        <Routes>
          <Route path="/careers" element={<Careers />} />
          <Route path="/" element={<h1>Home destination</h1>} />
        </Routes>
      </ConversationProvider>
    </MemoryRouter>,
  );
}
async function ready() {
  page();
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Send introduction",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
}
function fill() {
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Test Applicant" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "test@example.invalid" },
  });
  fireEvent.change(screen.getByLabelText("A little about yourself"), {
    target: {
      value: "I build thoughtful software and would like to contribute.",
    },
  });
  fireEvent.click(screen.getByRole("checkbox"));
}
function pdf(name = "cv.pdf", content = "%PDF-1.7\nTest fixture only\n%%EOF") {
  const file = new File([content], name, { type: "application/pdf" });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(content).buffer,
  });
  return file;
}
async function choose(file: File) {
  fireEvent.change(screen.getByLabelText("Choose CV"), {
    target: { files: [file] },
  });
  await waitFor(() =>
    expect(screen.queryByText("Checking document format…")).toBeNull(),
  );
}
it("renders the careers route, useful actions, copy email and Home fallback without vacancies", async () => {
  await ready();
  expect(
    screen.getByRole("heading", { name: "Work with kailor" }),
  ).toBeTruthy();
  for (const [name, to] of [
    ["How it works", "/how-it-works"],
    ["What we've built", "/#what-weve-built"],
    ["Contact us", "/contact"],
  ])
    expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(to);
  fireEvent.click(screen.getByRole("button", { name: "Copy email address" }));
  await screen.findByText("Copied");
  expect(writeText).toHaveBeenCalledWith("keenosmith@kailor.co.za");
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByText("Home destination")).toBeTruthy();
});
it("uses inline required/email/URL/acknowledgement validation with no native required prompts", async () => {
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Send introduction" }));
  expect(screen.getByText("Please enter your full name.")).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByLabelText("Full name"));
  expect(document.querySelectorAll("[required]").length).toBe(0);
  expect((screen.getByRole("form") as HTMLFormElement).noValidate).toBe(true);
  fill();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "invalid" },
  });
  fireEvent.change(
    screen.getByLabelText("Portfolio, GitHub or LinkedIn (optional)"),
    { target: { value: "javascript:alert(1)" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Send introduction" }));
  expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
  expect(screen.getByText(/Enter a full http/)).toBeTruthy();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(validateCareer(emptyCareerFields, false).acknowledgement).toBeTruthy();
});
it("selects multiple interests without changing a draft and submits the CV once before a confirmed shared toast", async () => {
  await ready();
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Software engineering" }));
  fireEvent.click(screen.getByRole("button", { name: "AI & automation" }));
  expect(
    screen
      .getByRole("button", { name: "Software engineering" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(
    (screen.getByLabelText("A little about yourself") as HTMLTextAreaElement)
      .value,
  ).toContain("thoughtful software");
  await choose(pdf());
  expect(screen.getByText("cv.pdf")).toBeTruthy();
  let resolve!: (value: unknown) => void;
  fetcher.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  fireEvent.submit(screen.getByRole("form"));
  fireEvent.submit(screen.getByRole("form"));
  expect(fetcher).toHaveBeenCalledTimes(2);
  const options = fetcher.mock.calls[1][1];
  expect(JSON.parse(options.body.get("interests"))).toEqual([
    "Software engineering",
    "AI & automation",
  ]);
  expect(options.body.get("cv").name).toBe("cv.pdf");
  expect(
    (
      screen.getByRole("button", {
        name: "Sending introduction",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await act(async () =>
    resolve({ status: 201, json: async () => ({ received: true }) }),
  );
  await screen.findByText(
    "Introduction received. Thank you for getting in touch.",
  );
  expect(document.querySelector(".kailor-conversation-toast")).toBeTruthy();
  expect((screen.getByLabelText("Full name") as HTMLInputElement).value).toBe(
    "",
  );
  expect(screen.queryByText("cv.pdf")).toBeNull();
});
it("retains fields and selected CV on unsuccessful or unconfirmed delivery", async () => {
  await ready();
  fill();
  await choose(pdf());
  fetcher.mockResolvedValueOnce({
    status: 502,
    json: async () => ({ received: false }),
  });
  fireEvent.submit(screen.getByRole("form"));
  await screen.findByText(/Your introduction could not be confirmed/);
  expect(screen.getByText("cv.pdf")).toBeTruthy();
  expect((screen.getByLabelText("Full name") as HTMLInputElement).value).toBe(
    "Test Applicant",
  );
  expect(
    screen.queryByText(
      "Introduction received. Thank you for getting in touch.",
    ),
  ).toBeNull();
});
it("fails closed for disabled or unavailable policy and offers direct email", async () => {
  fetcher.mockResolvedValue({
    ok: true,
    json: async () => ({ available: false }),
  });
  page();
  await screen.findByText(/Online introductions are currently unavailable/);
  expect(
    (
      screen.getByRole("button", {
        name: "Send introduction",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    screen
      .getByRole("link", { name: "introduce yourself by email" })
      .getAttribute("href"),
  ).toContain("mailto:");
  fill();
  fireEvent.submit(screen.getByRole("form"));
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("supports drag/drop, replacement and removal while rejecting extension, size, empty and false signatures", async () => {
  await ready();
  await choose(new File(["bad"], "cv.exe"));
  expect(screen.getByText("Choose a PDF or DOCX document.")).toBeTruthy();
  await choose(new File([], "cv.pdf"));
  expect(screen.getByText(/This file is empty/)).toBeTruthy();
  const huge = pdf();
  Object.defineProperty(huge, "size", { value: CV_MAX_BYTES + 1 });
  await choose(huge);
  expect(screen.getByText("Your CV must be 5 MB or smaller.")).toBeTruthy();
  await choose(pdf("fake.pdf", "not a pdf"));
  expect(screen.getByText(/contents do not match/)).toBeTruthy();
  const drop = document.querySelector(".career-cv")!;
  fireEvent.drop(drop, { dataTransfer: { files: [pdf("dropped.pdf")] } });
  await screen.findByText("dropped.pdf");
  await choose(pdf("replacement.pdf"));
  expect(screen.queryByText("dropped.pdf")).toBeNull();
  expect(screen.getByText("replacement.pdf")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove CV" }));
  expect(screen.queryByText("replacement.pdf")).toBeNull();
});
it("opens the shared chat from the helpful actions", async () => {
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Start a conversation" }));
  expect(
    await screen.findByRole("dialog", { name: "Let's chat" }),
  ).toBeTruthy();
});
