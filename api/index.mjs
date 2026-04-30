import handler from "../dist/server/server.js";

export default async function (req, res) {
  return handler(req, res);
}
