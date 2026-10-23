import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import emailjs from "@emailjs/browser";
import Contact from "../src/pages/Public/Contact/Contact";
import { ConversationProvider } from "../src/components/public/ConversationModal/ConversationModal";
import {
  CONTACT_EMAIL,
  ENQUIRY_TOPICS,
  ENQUIRY_LIMITS,
  sendEnquiry,
  validateEnquiry,
} from "../src/services/enquiries";
vi.mock("@emailjs/browser", () => ({ default: { send: vi.fn() } }));
vi.mock("motion/react", async (original) => {
  const actual = await original<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => true,
    useScroll: () => ({ scrollYProgress: actual.motionValue(0.5) }),
  };
});
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const writeText = vi.fn();
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
  vi.mocked(emailjs.send)
    .mockReset()
    .mockResolvedValue({ status: 200, text: "OK" });
  vi.stubEnv("VITE_EMAILJS_SERVICE_ID", "test-service");
  vi.stubEnv("VITE_EMAILJS_TEMPLATE_ID", "test-template");
  vi.stubEnv("VITE_EMAILJS_PUBLIC_KEY", "test-public-key");
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});
function page() {
  return render(
    <MemoryRouter>
      <ConversationProvider>
        <Contact />
      </ConversationProvider>
    </MemoryRouter>,
  );
}
function fill(scope: Pick<typeof screen, "getByLabelText"> = screen) {
  fireEvent.change(scope.getByLabelText("Your name"), {
    target: { value: "  Alex  " },
  });
  fireEvent.change(scope.getByLabelText("Email address"), {
    target: { value: "alex@example.com" },
  });
  fireEvent.change(scope.getByLabelText("Your message"), {
    target: { value: "Please help us connect our existing systems." },
  });
}
it("validates fields, exposes errors and focuses the first invalid field", () => {
  page();
  fireEvent.submit(screen.getByRole("form", { name: "Contact enquiry" }));
  expect(screen.getAllByRole("alert")).toHaveLength(3);
  expect(document.activeElement).toBe(screen.getByLabelText("Your name"));
  expect(screen.getByLabelText("Your name").getAttribute("aria-invalid")).toBe(
    "true",
  );
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Alex" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "bad-email" },
  });
  fireEvent.change(screen.getByLabelText("Your message"), {
    target: { value: "Short" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "Contact enquiry" }));
  expect(document.activeElement).toBe(screen.getByLabelText("Email address"));
  expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
  expect(screen.getByText("Please add a little more detail.")).toBeTruthy();
  expect(emailjs.send).not.toHaveBeenCalled();
});
it("updates one optional topic without changing the message or submitting it", () => {
  page();
  fill();
  const topics = within(screen.getByRole("group", { name: "Enquiry topic" }));
  for (const topic of ENQUIRY_TOPICS) {
    fireEvent.click(topics.getByRole("button", { name: topic }));
    expect(
      document.querySelectorAll(".contact-topics [aria-pressed=true]"),
    ).toHaveLength(1);
    expect(
      document.querySelector<HTMLInputElement>("input[name=enquiry-topic]")
        ?.value,
    ).toBe(topic);
    expect(
      (screen.getByLabelText("Your message") as HTMLTextAreaElement).value,
    ).toContain("existing systems");
  }
  fireEvent.click(topics.getByRole("button", { name: "Something else" }));
  expect(
    document.querySelectorAll(".contact-topics [aria-pressed=true]"),
  ).toHaveLength(0);
  expect(emailjs.send).not.toHaveBeenCalled();
});
it("prevents duplicate sends and only clears/notifies after provider confirmation", async () => {
  let confirm!: (value: { status: number; text: string }) => void;
  vi.mocked(emailjs.send).mockReturnValueOnce(
    new Promise((resolve) => {
      confirm = resolve;
    }),
  );
  page();
  fill();
  fireEvent.click(screen.getByRole("button", { name: ENQUIRY_TOPICS[1] }));
  const form = screen.getByRole("form", { name: "Contact enquiry" });
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(emailjs.send).toHaveBeenCalledTimes(1);
  expect(emailjs.send).toHaveBeenCalledWith(
    "test-service",
    "test-template",
    {
      from_name: "Alex",
      reply_to: "alex@example.com",
      subject: `Website enquiry — ${ENQUIRY_TOPICS[1]}`,
      message: "Please help us connect our existing systems.",
    },
    { publicKey: "test-public-key" },
  );
  expect(
    screen
      .getByRole("button", { name: "Sending message" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(screen.queryByText("Your message has been sent.")).toBeNull();
  await act(async () => confirm({ status: 200, text: "OK" }));
  expect(
    (await screen.findByText("Your message has been sent.")).closest(
      ".kailor-conversation-toast",
    ),
  ).toBeTruthy();
  expect((screen.getByLabelText("Your name") as HTMLInputElement).value).toBe(
    "",
  );
});
it("preserves entered content and offers direct email on failure without exposing provider details", async () => {
  vi.mocked(emailjs.send).mockRejectedValueOnce(
    new Error("Private provider diagnostic"),
  );
  page();
  fill();
  fireEvent.submit(screen.getByRole("form", { name: "Contact enquiry" }));
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("couldn't be sent");
  expect(within(alert).getByRole("link").getAttribute("href")).toBe(
    `mailto:${CONTACT_EMAIL}`,
  );
  expect(
    (screen.getByLabelText("Your message") as HTMLTextAreaElement).value,
  ).toContain("existing systems");
  expect(screen.queryByText("Private provider diagnostic")).toBeNull();
  expect(screen.queryByText("Your message has been sent.")).toBeNull();
});
it("fails safely when configuration is absent", async () => {
  vi.stubEnv("VITE_EMAILJS_SERVICE_ID", "");
  page();
  fill();
  fireEvent.submit(screen.getByRole("form", { name: "Contact enquiry" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(emailjs.send).not.toHaveBeenCalled();
  expect(
    (screen.getByLabelText("Your name") as HTMLInputElement).value.trim(),
  ).toBe("Alex");
});
it("uses the same delivery contract and confirmed-send toast from the original chat modal", async () => {
  page();
  fireEvent.click(
    screen.getByRole("button", { name: "Start conversation", exact: true }),
  );
  const dialog = screen.getByRole("dialog", { name: "Let's chat" });
  fill(within(dialog));
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Send message", exact: true }),
  );
  await waitFor(() => expect(emailjs.send).toHaveBeenCalledTimes(1));
  expect(vi.mocked(emailjs.send).mock.calls[0][2]).toMatchObject({
    subject: "Website enquiry",
    from_name: "Alex",
    reply_to: "alex@example.com",
  });
  expect(
    (await screen.findByText("Your message has been sent.")).closest(
      ".kailor-conversation-toast",
    ),
  ).toBeTruthy();
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Let's chat" })).toBeNull(),
  );
});
it("confirms copying, restores the icon and never reports clipboard failures as success", async () => {
  page();
  fireEvent.click(screen.getByRole("button", { name: "Copy email address" }));
  expect(await screen.findByText("Copied")).toBeTruthy();
  expect(writeText).toHaveBeenCalledWith(CONTACT_EMAIL);
  await waitFor(
    () =>
      expect(
        screen.getByRole("button", { name: "Copy email address" }),
      ).toBeTruthy(),
    { timeout: 3000 },
  );
  writeText.mockRejectedValueOnce(new Error("Denied"));
  fireEvent.click(screen.getByRole("button", { name: "Copy email address" }));
  expect(await screen.findByText(/Couldn't copy/)).toBeTruthy();
  expect(screen.queryByText("Copied")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Send an email" }).getAttribute("href"),
  ).toBe(`mailto:${CONTACT_EMAIL}`);
});
it("keeps provider calls behind shared length, topic and receipt checks", async () => {
  expect(
    validateEnquiry({
      name: "x".repeat(ENQUIRY_LIMITS.name + 1),
      email: "bad",
      message: "short",
    }),
  ).toEqual({
    name: "Please use a shorter name.",
    email: "Enter a valid email address.",
    message: "Please add a little more detail.",
  });
  const valid = {
    name: "Alex",
    email: "alex@example.com",
    message: "A reasonably detailed enquiry.",
  };
  await expect(
    sendEnquiry(valid, "untrusted\r\nsubject" as never),
  ).rejects.toThrow();
  expect(emailjs.send).not.toHaveBeenCalled();
  vi.mocked(emailjs.send).mockResolvedValueOnce({
    status: 500,
    text: "Failed",
  });
  await expect(sendEnquiry(valid)).rejects.toThrow(/couldn't be sent/);
});

it("fills editable topic starters, replaces untouched starters and preserves an edited draft", () => {
  page();
  const message = screen.getByLabelText("Your message") as HTMLTextAreaElement;
  expect(message.placeholder).toBe("Tell us a little about your project...");
  fireEvent.click(screen.getByRole("button", { name: ENQUIRY_TOPICS[0] }));
  expect(message.value).toContain("I have a project in mind");
  fireEvent.click(screen.getByRole("button", { name: ENQUIRY_TOPICS[1] }));
  expect(message.value).toBe("I'd like technical advice about ");
  fireEvent.change(message, {
    target: { value: "I'd like technical advice about our data workflow." },
  });
  fireEvent.click(screen.getByRole("button", { name: ENQUIRY_TOPICS[2] }));
  expect(message.value).toBe(
    "I'd like technical advice about our data workflow.",
  );
  expect(
    document.querySelectorAll(".contact-topics [aria-pressed=true]"),
  ).toHaveLength(1);
  expect(document.querySelector("form")?.noValidate).toBe(true);
  expect(document.querySelectorAll("form [required]")).toHaveLength(0);
  expect(
    screen
      .getByRole("button", { name: "Send message", exact: true })
      .closest(".kailor-enquiry-composer"),
  ).toBeTruthy();
});
