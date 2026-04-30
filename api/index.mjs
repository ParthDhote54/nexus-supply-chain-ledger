export default async function handler(req, res) {
  const server = await import("../dist/server/server.js");
  return server.default(req, res);
}
