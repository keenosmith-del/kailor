import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ApplicationForm } from "../src/pages/Public/Careers/PublicCareerEmail";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("offers a career email draft with selected interests without uploading documents or calling the application API", () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  render(
    <ApplicationForm
      interests={["Software engineering", "Cloud infrastructure"]}
      sending={false}
      setSending={() => {}}
    />,
  );
  const link = screen.getByRole("link", {
    name: "Introduce yourself by email",
  });
  const url = new URL(link.getAttribute("href")!);
  expect(url.protocol).toBe("mailto:");
  expect(url.pathname).toBe("keenosmith@kailor.co.za");
  expect(url.searchParams.get("subject")).toBe("Working with kailor");
  expect(url.searchParams.get("body")).toContain(
    "Software engineering, Cloud infrastructure",
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(document.querySelector('input[type="file"]')).toBeNull();
});
