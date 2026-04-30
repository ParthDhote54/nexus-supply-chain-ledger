async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return undefined;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function toWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `${protocol}://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return new Request(url, {
    method: req.method,
    headers,
    body: await readBody(req),
  });
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));

  if (!response.body) {
    res.end();
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

export default async function handler(req, res) {
  const mod = await import("../dist/server/server.js");
  const server = mod.default ?? mod;

  if (typeof server === "function") {
    const result =
      server.length >= 2
        ? await server(req, res)
        : await server(await toWebRequest(req));
    if (result instanceof Response) return sendWebResponse(res, result);
    if (!res.writableEnded) return result;
    return;
  }

  if (server && typeof server.fetch === "function") {
    const response = await server.fetch(await toWebRequest(req));
    return sendWebResponse(res, response);
  }

  throw new TypeError("Unsupported TanStack Start server export");
}
