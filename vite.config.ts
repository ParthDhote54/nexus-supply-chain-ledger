import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// TanStack Start + React + Tailwind v4 + tsconfig-paths are all wired by
// the Lovable preset. This is what produces the SSR build output that
// Vercel expects:
//   dist/client/...        (static assets)
//   dist/server/server.js  (SSR handler imported by api/index.mjs)
export default defineConfig({});
