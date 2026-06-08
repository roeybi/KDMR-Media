import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
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
        live:        path.resolve(import.meta.dirname, "live/index.html"),
        upload:      path.resolve(import.meta.dirname, "upload.html"),
        admin:       path.resolve(import.meta.dirname, "admin.html"),
        cmsAdmin:    path.resolve(import.meta.dirname, "admin/index.html"),
        auth:        path.resolve(import.meta.dirname, "auth/index.html"),
        undukNgadau:    path.resolve(import.meta.dirname, "unduk-ngadau/index.html"),
        mrk:            path.resolve(import.meta.dirname, "mrk/index.html"),
        sugandoi:       path.resolve(import.meta.dirname, "sugandoi/index.html"),
        peninsular2026: path.resolve(import.meta.dirname, "peninsular-2026.html"),
        predict:        path.resolve(import.meta.dirname, "predict/index.html"),
      },
    },
  },
});
