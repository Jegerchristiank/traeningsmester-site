import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import hosting from "./vercel.json";

// The preview server serves the same static documents as the Vercel rewrites.
const documents = hosting.rewrites.filter((route) =>
  route.destination.endsWith(".html"),
);

export default defineConfig({
  plugins: [
    react(),
    {
      name: "preview-document-routes",
      configurePreviewServer(server) {
        server.middlewares.use((request, _response, next) => {
          const url = new URL(request.url || "/", "http://localhost");
          const path = url.pathname.replace(/\/$/, "") || "/";
          const route = documents.find(({ source }) =>
            source.endsWith("/:path*")
              ? path.startsWith(source.slice(0, -":path*".length))
              : source === path,
          );
          if (route) request.url = route.destination + url.search;
          next();
        });
      },
    },
  ],
  server: { host: true, port: 3000, strictPort: true, allowedHosts: true },
  build: { chunkSizeWarningLimit: 550, sourcemap: false },
});
