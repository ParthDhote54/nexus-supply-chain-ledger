// Vercel Node.js serverless function entry that delegates every non-static
// request to the TanStack Start SSR server bundled at dist/server/server.js.
// The bundle is pulled in via vercel.json -> functions.includeFiles.
export default async function handler(req, res) {
  const mod = await import("../dist/server/server.js");
  const server = mod.default ?? mod;
  return server(req, res);
}
