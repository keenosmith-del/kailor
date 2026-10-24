import { spawnSync } from "node:child_process";
const env = { ...process.env, KAILOR_PUBLIC_ONLY_BUILD: "true" };
for (const [command, args] of [
  ["npm", ["run", "typecheck", "-w", "frontend"]],
  [
    "npm",
    [
      "exec",
      "-w",
      "frontend",
      "--",
      "vite",
      "build",
      "--config",
      "vite.public.config.ts",
      "--mode",
      "public",
    ],
  ],
  ["node", ["scripts/prerender-public.mjs"]],
  ["node", ["scripts/prepare-pages.mjs"]],
  ["node", ["scripts/verify-launch.mjs"]],
]) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
