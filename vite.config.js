import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true"
    ? "/web-based-tracking-system-Importadex/"
    : "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
