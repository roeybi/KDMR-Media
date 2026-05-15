import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/KDMR-Archive-Hub/",
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:        path.resolve(import.meta.dirname, "index.html"),
        winners:     path.resolve(import.meta.dirname, "winners.html"),
        news:        path.resolve(import.meta.dirname, "news.html"),
        undukNgadau: path.resolve(import.meta.dirname, "unduk-ngadau/index.html"),
        mrk:         path.resolve(import.meta.dirname, "mrk/index.html"),
        sugandoi:    path.resolve(import.meta.dirname, "sugandoi/index.html"),
      },
    },
  },
});
