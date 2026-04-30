# NEXUS — Backend

Optional helper server. The blockchain is the source of truth.

## Run

```bash
cd backend
npm install
npm start   # http://localhost:8787
```

## Routes

- `GET  /api/health` — health probe
- `GET  /api/demo/status` — network info for the UI
- `POST /api/audit/export` — save an audit JSON to `backend/data/`
- `POST /api/forensics/export` — save a forensics JSON to `backend/data/`
