import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: { dedupe: ["react", "react-dom"] },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": process.env.KAILOR_API_ORIGIN ?? "http://127.0.0.1:5050" },
  },
  build: { sourcemap: false },
});
