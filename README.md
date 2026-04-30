# NEXUS Semiconductor Ledger

Blockchain-based semiconductor supply-chain tracking with on-chain chip passports, lifecycle progression, ownership transfer, fraud detection, and a security operations dashboard.

- **Frontend:** React 19 + TanStack Router + Tailwind v4 + Zustand + ethers v6
- **Smart contract:** Solidity (`SupplyChain.sol`) — already deployed on **Sepolia** at `0x3da80c927718fbBe51120FcC3b255fB30Fe60BDE`
- **Backend (optional):** Express server for audit/forensics report exports

---

## 1. Local development

```bash
# Install
npm install

# Run dev server (http://localhost:8080 by default — depends on Lovable Tanstack config)
npm run dev

# Production build
npm run build

# Preview the production build
npm run preview
```

The frontend talks to the deployed Sepolia contract via the user's MetaMask. No `.env` is required for the frontend in development — the contract address and chain ID are hard-coded in `src/lib/contract-config.ts`.

### Backend (optional)

```bash
cd backend
npm install
node server.js     # listens on PORT=8787
```

### Smart contract (already deployed — only re-run if you redeploy)

```bash
cd blockchain
npm install
npx hardhat compile
# To redeploy: configure blockchain/.env with PRIVATE_KEY and SEPOLIA_RPC_URL,
# then: npx hardhat run scripts/deploy.js --network sepolia
```

---

## 2. Hosting

### 2.1 Push to GitHub
```bash
git init
git add .
git commit -m "NEXUS Semiconductor Ledger"
git branch -M main
git remote add origin git@github.com:<you>/nexus-ledger.git
git push -u origin main
```

### 2.2 Frontend on Vercel
1. Go to <https://vercel.com> → **New Project** → import the repo.
2. Vercel auto-detects Vite. The included `vercel.json` sets:
   - Build command: `npm run build`
   - Output dir: `dist`
   - SPA rewrite (so deep links like `/security` work on refresh).
3. (Optional) Set env vars from `.env.example` if you want to override defaults.
4. Deploy. You'll get a URL like `https://nexus-ledger.vercel.app`.

### 2.3 Frontend on Netlify (alternative)
The included `netlify.toml` works out of the box: connect the repo and Netlify will build and apply the SPA redirect.

### 2.4 Backend on Render (optional)
1. <https://render.com> → **New +** → **Blueprint** → point at the repo.
2. Render reads `render.yaml`, creates a Web Service from `/backend`, runs `npm install` then `node server.js`.
3. After deploy, copy the URL (e.g. `https://nexus-backend.onrender.com`) and set `VITE_BACKEND_URL` on Vercel to it.

### 2.5 Smart contract
Already live on Sepolia: <https://sepolia.etherscan.io/address/0x3da80c927718fbBe51120FcC3b255fB30Fe60BDE>

The address is stored in `src/lib/contract-config.ts`. **Do not change it** unless you redeploy.

---

## 3. Using the app

1. Open the deployed frontend URL.
2. Click **Connect MetaMask** in the navbar.
3. The app will prompt MetaMask to switch to **Sepolia** (chainId `0xaa36a7`) — accept.
4. Get free Sepolia ETH from a faucet (e.g. <https://sepoliafaucet.com>).
5. Use the role tabs (Vendor / Manufacturer / Distributor / Integrator / Auditor / Recycler) to:
   - Register chips on-chain
   - Advance lifecycle stages
   - Transfer ownership directly to another wallet address
   - Verify / flag chips (auditor)
6. Every successful action returns a real Sepolia tx hash — clickable through to Etherscan.
7. Visit `/security` for the live security operations dashboard.

---

## 4. Project structure

```
.
├── src/                   # React frontend
│   ├── routes/            # TanStack Router pages (incl. /security)
│   ├── components/nexus/  # Dashboards, forms, navbar, security panels
│   ├── components/ui/     # shadcn primitives
│   └── lib/
│       ├── blockchain.ts          # MetaMask + ethers provider/signer
│       ├── contract-actions.ts    # Typed wrappers around contract calls
│       ├── contract-config.ts     # ABI + deployed address
│       └── nexus-store.ts         # Zustand store wired to real txs
├── backend/               # Express API for report exports
├── blockchain/            # Hardhat project + SupplyChain.sol
├── vercel.json            # Vercel deploy config
├── netlify.toml           # Netlify deploy config
└── render.yaml            # Render blueprint for backend
```

---

## 5. Notes

- Users need **Sepolia ETH** for any write transaction.
- The previous owner of a chip cannot update it after `transferOwnershipDirect` — this is enforced on-chain.
- Never commit `.env`, `blockchain/artifacts`, `blockchain/cache`, `node_modules`, or private keys.
</content>
