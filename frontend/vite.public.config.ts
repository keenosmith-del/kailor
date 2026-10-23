import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { publicBuildBoundary } from "../scripts/public-build-boundary";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwind(), publicBuildBoundary()],
  publicDir: false,
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      {
        find: "./ApplicationForm/ApplicationForm",
        replacement: fileURLToPath(
          new URL(
            "./src/pages/Public/Careers/PublicCareerEmail.tsx",
            import.meta.url,
          ),
        ),
      },
    ],
  },
  build: { outDir: "dist-public", sourcemap: false },
});
