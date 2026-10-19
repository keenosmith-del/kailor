/** Supply root-relative URLs from public/media. Empty entries render designed fallbacks. */
export type PublicMedia = {
  desktopMp4?: string;
  mobileMp4?: string;
  poster?: string;
  image?: string;
  description?: string;
};
export const media: Record<"hero" | "conversation" | "work", PublicMedia> = {
  hero: {
    description:
      "An abstract sculptural form representing thoughtful connections.",
  },
  conversation: {
    description:
      "An illustrative conversation about simplifying business administration.",
  },
  work: {
    description:
      "Illustrative solution concepts, not commissioned client work.",
  },
};
