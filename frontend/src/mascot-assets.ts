export const mascotAssets = {
  head: "/mascot/heads/kailor-head-neutral.png",
  greeting: "/mascot/poses/kailor-neutral.png",
  curious: "/mascot/poses/kailor-confused.png",
  attentive: "/mascot/poses/kailor-neutral.png",
  thinking: "/mascot/poses/kailor-pensive.png",
  conversation: "/mascot/poses/kailor-neutral.png",
  recommendation: "/mascot/poses/kailor-pensive.png",
  completed: "/mascot/poses/kailor-neutral.png",
} as const;

// Discovery advances through every supplied body pose after each accepted response.
export const discoveryPoseAssets = [
  "/mascot/poses/kailor-neutral.png",
  "/mascot/poses/kailor-pensive.png",
  "/mascot/poses/kailor-confused.png",
  "/mascot/poses/kailor-impatient.png",
  "/mascot/poses/kailor-grumpy.png",
  "/mascot/poses/kailor-unamused.png",
  "/mascot/poses/kailor-facepalm.png",
  "/mascot/poses/kailor-hiding.png",
  "/mascot/poses/kailor-annoyed.png",
] as const;

export const discoveryCompletionPose = "/mascot/other/kailor-smiling.png";
