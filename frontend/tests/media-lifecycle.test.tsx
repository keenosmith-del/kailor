import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { CloudVisual } from "../src/components/public/StackedPanels/StackedPanels";
const state = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", async (original) => ({
  ...(await original<typeof import("motion/react")>()),
  useInView: () => true,
  useReducedMotion: () => state.reduced,
}));
beforeEach(() => {
  state.reduced = false;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("preserves native muted inline autoplay and looping of the original MP4", () => {
  render(<CloudVisual />);
  const video = document.querySelector("video")!;
  expect(video.getAttribute("src")).toBe("/videos/kailor-built-for-loop.mp4");
  expect(video.autoplay).toBe(true);
  expect(video.loop).toBe(true);
  expect(video.muted).toBe(true);
  expect(video.playsInline).toBe(true);
});
it("shows the video on loaded data and restores the word fallback on error", () => {
  render(<CloudVisual />);
  const video = document.querySelector("video")!;
  expect(video.classList.contains("is-ready")).toBe(false);
  fireEvent.loadedData(video);
  expect(video.classList.contains("is-ready")).toBe(true);
  fireEvent.error(video);
  expect(video.classList.contains("is-ready")).toBe(false);
});
it("starts with fresh readiness when the panel remounts", () => {
  const view = render(<CloudVisual />);
  fireEvent.loadedData(document.querySelector("video")!);
  view.unmount();
  render(<CloudVisual />);
  expect(document.querySelector("video")?.classList.contains("is-ready")).toBe(
    false,
  );
});
it("keeps the original video element without autoplay in reduced motion", () => {
  state.reduced = true;
  render(<CloudVisual />);
  expect(document.querySelector("video")?.autoplay).toBe(false);
  expect(
    document.querySelector(".service-art__changing-word")?.textContent,
  ).toContain("clarity");
});
