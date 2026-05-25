import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    tailwindcss(),
  ],
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
        main:         path.resolve(import.meta.dirname, "index.html"),
        winners:      path.resolve(import.meta.dirname, "winners.html"),
        news:         path.resolve(import.meta.dirname, "news.html"),
        live:         path.resolve(import.meta.dirname, "live/index.html"),
        upload:       path.resolve(import.meta.dirname, "upload.html"),
        admin:        path.resolve(import.meta.dirname, "admin.html"),
        undukNgadau:    path.resolve(import.meta.dirname, "unduk-ngadau/index.html"),
        mrk:            path.resolve(import.meta.dirname, "mrk/index.html"),
        sugandoi:       path.resolve(import.meta.dirname, "sugandoi/index.html"),
        peninsular2026: path.resolve(import.meta.dirname, "peninsular-2026.html"),
        predict:        path.resolve(import.meta.dirname, "predict/index.html"),
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
