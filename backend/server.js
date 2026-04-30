// Lightweight Express backend for NEXUS.
// The blockchain is the source of truth. This server only:
//   - exposes a health endpoint
//   - persists optional audit/forensics export JSON files locally
//   - serves a /api/demo/status helper for the UI
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "nexus-backend", time: new Date().toISOString() });
});

app.get("/api/demo/status", (_req, res) => {
  res.json({
    ok: true,
    blockchain: "Sepolia",
    chainId: 11155111,
    note: "Connect MetaMask to Sepolia in the frontend. Backend is optional.",
  });
});

function saveExport(kind, payload) {
  const id = `${kind}-${Date.now()}`;
  const file = path.join(DATA_DIR, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify({ id, kind, payload, savedAt: new Date().toISOString() }, null, 2));
  return { id, file };
}

app.post("/api/audit/export", (req, res) => {
  const { id, file } = saveExport("audit", req.body || {});
  res.json({ ok: true, id, file });
});

app.post("/api/forensics/export", (req, res) => {
  const { id, file } = saveExport("forensics", req.body || {});
  res.json({ ok: true, id, file });
});

app.listen(PORT, () => {
  console.log(`✅ NEXUS backend running on http://localhost:${PORT}`);
});
