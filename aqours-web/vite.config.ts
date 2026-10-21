import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  envDir: process.env.AQOURS_NO_DOTENV === "1" ? false : undefined,
  plugins: [tailwindcss()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
