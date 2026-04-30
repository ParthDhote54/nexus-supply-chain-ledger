import { create } from "zustand";
import { toast } from "sonner";
import {
  connectWallet as walletConnect,
  switchToSepolia,
  checkNetwork,
  onWalletChange,
} from "./blockchain";
import {
  registerChipOnChain,
  transferOwnershipDirectOnChain,
  releaseOwnershipOnChain,
  acquireOwnershipOnChain,
  integrateChipOnChain,
  manufactureChipOnChain,
  distributeChipOnChain,
  verifyChipOnChain,
  recycleChipOnChain,
  flagChipOnChain,
  updateRiskScoreOnChain,
  getChipFromChain,
} from "./contract-actions";
import { CONTRACT_ADDRESS } from "./contract-config";

// Map UI role -> on-chain RoleEnum string used by contract-actions
const UI_ROLE_TO_CHAIN: Record<string, "Vendor" | "Integrator" | "Foundry" | "Distributor" | "EndUser" | "Recycler" | "Auditor"> = {
  vendor: "Vendor",
  integrator: "Integrator",
  foundry: "Foundry",
  distributor: "Distributor",
  enduser: "EndUser",
  recycler: "Recycler",
  auditor: "Auditor",
};

// Map UI Stage -> on-chain advance function
async function advanceStageOnChain(stage: string, chipId: string) {
  switch (stage) {
    case "Integrated":   return integrateChipOnChain(chipId);
    case "Manufactured": return manufactureChipOnChain(chipId);
    case "Distributed":  return distributeChipOnChain(chipId);
    case "Verified":     return verifyChipOnChain(chipId);
    case "Recycled":     return recycleChipOnChain(chipId);
    default: return { ok: false as const, error: `No on-chain action for stage ${stage}` };
  }
}

export type Role =
  | "vendor"
  | "integrator"
  | "foundry"
  | "distributor"
  | "enduser"
  | "recycler"
  | "auditor";

export const ROLES: { id: Role; label: string; short: string }[] = [
  { id: "vendor", label: "Vendor", short: "VND" },
  { id: "integrator", label: "Integrator", short: "INT" },
  { id: "foundry", label: "Foundry / Manufacturer", short: "FAB" },
  { id: "distributor", label: "Distributor", short: "DST" },
  { id: "enduser", label: "End User", short: "EUS" },
  { id: "recycler", label: "Recycler", short: "RCY" },
  { id: "auditor", label: "Auditor / Admin", short: "AUD" },
];

export type Stage =
  | "Registered"
  | "Ownership Released"
  | "Ownership Acquired"
  | "Integrated"
  | "Manufactured"
  | "Distributed"
  | "Verified"
  | "Recycled";

export const STAGE_FLOW: Stage[] = [
  "Registered",
  "Ownership Released",
  "Ownership Acquired",
  "Integrated",
  "Manufactured",
  "Distributed",
  "Verified",
  "Recycled",
];

export type VerificationStatus = "Authentic" | "Fake" | "Cloned" | "Tampered" | "Unknown";

export interface LifecycleEvent {
  stage: Stage;
  actor: string;
  timestamp: number;
  txHash: string;
  note?: string;
}

export interface Chip {
  id: string;
  batch: string;
  vendor: string;
  pufHash: string;
  watermarkHash: string;
  certHash: string;
  manufactureDate: string;
  owner: string;
  origin: string;
  stage: Stage;
  status: VerificationStatus;
  riskScore: number;
  riskReasons: string[];
  history: LifecycleEvent[];
  lastTxHash: string;
}

export interface LedgerEvent {
  id: string;
  type:
    | "Chip Registered"
    | "Ownership Transferred"
    | "Integrated"
    | "Manufactured"
    | "Distributed"
    | "Verified"
    | "Recycled"
    | "Fraud Alert";
  actor: string;
  chipId?: string;
  stage?: Stage;
  timestamp: number;
  txHash: string;
  severity?: "info" | "warn" | "danger";
  message?: string;
}

export interface FraudAlert {
  id: string;
  kind:
    | "Duplicate chip detected"
    | "Unauthorized ownership transfer"
    | "Stage skipping attempt"
    | "Fake chip verification"
    | "Certificate mismatch";
  chipId: string;
  timestamp: number;
  detail: string;
}

// Deterministic PRNG so server/client SSR hydration matches.
let __seed = 0x9E3779B9;
const rand = () => {
  __seed = (__seed * 1664525 + 1013904223) >>> 0;
  return __seed / 0xffffffff;
};
const hex = (len: number) =>
  Array.from({ length: len }, () => Math.floor(rand() * 16).toString(16)).join("");

const SAMPLE_WALLET = (n: number) =>
  "0x" + (hex(16) + n.toString(16).padStart(24, "0")).slice(0, 40);

const TX = () => "0x" + hex(64);

const HASH = (prefix: string) => "0x" + prefix + hex(60);

// Fixed epoch — avoids Date.now() drift between server render and client hydrate.
const NOW = 1735689600000; // 2025-01-01T00:00:00Z

const seedChips: Chip[] = [
  {
    id: "NXS-A1-00421",
    batch: "BATCH-2026-04",
    vendor: "TSMC Foundry Co.",
    pufHash: HASH("a1"),
    watermarkHash: HASH("b2"),
    certHash: HASH("c3"),
    manufactureDate: "2026-03-12",
    owner: SAMPLE_WALLET(1),
    origin: "Hsinchu, TW",
    stage: "Distributed",
    status: "Authentic",
    riskScore: 12,
    riskReasons: [],
    lastTxHash: TX(),
    history: [
      { stage: "Registered", actor: "Vendor", timestamp: NOW - 86400000 * 8, txHash: TX() },
      { stage: "Ownership Released", actor: "Vendor", timestamp: NOW - 86400000 * 7, txHash: TX() },
      { stage: "Ownership Acquired", actor: "Integrator", timestamp: NOW - 86400000 * 6, txHash: TX() },
      { stage: "Integrated", actor: "Integrator", timestamp: NOW - 86400000 * 5, txHash: TX() },
      { stage: "Manufactured", actor: "Foundry", timestamp: NOW - 86400000 * 3, txHash: TX() },
      { stage: "Distributed", actor: "Distributor", timestamp: NOW - 86400000 * 1, txHash: TX() },
    ],
  },
  {
    id: "NXS-A1-00422",
    batch: "BATCH-2026-04",
    vendor: "Samsung Semi",
    pufHash: HASH("d4"),
    watermarkHash: HASH("e5"),
    certHash: HASH("f6"),
    manufactureDate: "2026-03-15",
    owner: SAMPLE_WALLET(2),
    origin: "Hwaseong, KR",
    stage: "Verified",
    status: "Authentic",
    riskScore: 7,
    riskReasons: [],
    lastTxHash: TX(),
    history: [
      { stage: "Registered", actor: "Vendor", timestamp: NOW - 86400000 * 10, txHash: TX() },
      { stage: "Integrated", actor: "Integrator", timestamp: NOW - 86400000 * 6, txHash: TX() },
      { stage: "Manufactured", actor: "Foundry", timestamp: NOW - 86400000 * 4, txHash: TX() },
      { stage: "Distributed", actor: "Distributor", timestamp: NOW - 86400000 * 2, txHash: TX() },
      { stage: "Verified", actor: "Auditor", timestamp: NOW - 86400000 * 1, txHash: TX() },
    ],
  },
  {
    id: "NXS-A1-09999",
    batch: "BATCH-CLONED",
    vendor: "Unknown Source",
    pufHash: HASH("99"),
    watermarkHash: HASH("99"),
    certHash: HASH("00"),
    manufactureDate: "2026-02-01",
    owner: SAMPLE_WALLET(9),
    origin: "Shenzhen, CN",
    stage: "Integrated",
    status: "Cloned",
    riskScore: 86,
    riskReasons: ["Duplicate chip", "Failed verification", "Unknown owner"],
    lastTxHash: TX(),
    history: [
      { stage: "Registered", actor: "Vendor?", timestamp: NOW - 86400000 * 4, txHash: TX() },
      { stage: "Integrated", actor: "Unknown", timestamp: NOW - 86400000 * 2, txHash: TX() },
    ],
  },
  {
    id: "NXS-B2-10044",
    batch: "BATCH-2026-05",
    vendor: "Intel Foundry",
    pufHash: HASH("11"),
    watermarkHash: HASH("22"),
    certHash: HASH("33"),
    manufactureDate: "2026-04-02",
    owner: SAMPLE_WALLET(4),
    origin: "Hillsboro, US",
    stage: "Manufactured",
    status: "Authentic",
    riskScore: 22,
    riskReasons: ["Missing stage"],
    lastTxHash: TX(),
    history: [
      { stage: "Registered", actor: "Vendor", timestamp: NOW - 86400000 * 5, txHash: TX() },
      { stage: "Manufactured", actor: "Foundry", timestamp: NOW - 86400000 * 1, txHash: TX() },
    ],
  },
  {
    id: "NXS-B2-10045",
    batch: "BATCH-2026-05",
    vendor: "GlobalFoundries",
    pufHash: HASH("aa"),
    watermarkHash: HASH("bb"),
    certHash: HASH("cc"),
    manufactureDate: "2026-04-04",
    owner: SAMPLE_WALLET(5),
    origin: "Dresden, DE",
    stage: "Recycled",
    status: "Authentic",
    riskScore: 4,
    riskReasons: [],
    lastTxHash: TX(),
    history: [
      { stage: "Registered", actor: "Vendor", timestamp: NOW - 86400000 * 30, txHash: TX() },
      { stage: "Manufactured", actor: "Foundry", timestamp: NOW - 86400000 * 25, txHash: TX() },
      { stage: "Distributed", actor: "Distributor", timestamp: NOW - 86400000 * 20, txHash: TX() },
      { stage: "Verified", actor: "Auditor", timestamp: NOW - 86400000 * 15, txHash: TX() },
      { stage: "Recycled", actor: "Recycler", timestamp: NOW - 86400000 * 2, txHash: TX() },
    ],
  },
];

const seedLedger: LedgerEvent[] = seedChips.flatMap((c) =>
  c.history.slice(-2).map((h, i) => ({
    id: `${c.id}-${i}`,
    type: "Chip Registered" as LedgerEvent["type"],
    actor: c.owner,
    chipId: c.id,
    stage: h.stage,
    timestamp: h.timestamp,
    txHash: h.txHash,
    severity: "info" as const,
  }))
);

const seedAlerts: FraudAlert[] = [
  {
    id: "fa-1",
    kind: "Duplicate chip detected",
    chipId: "NXS-A1-09999",
    timestamp: NOW - 3600_000 * 6,
    detail: "PUF hash collides with NXS-A1-00421",
  },
  {
    id: "fa-2",
    kind: "Stage skipping attempt",
    chipId: "NXS-B2-10044",
    timestamp: NOW - 3600_000 * 12,
    detail: "Attempted Manufactured before Integrated",
  },
];

interface NexusState {
  walletAddress: string | null;
  network: string;
  role: Role;
  chips: Chip[];
  ledger: LedgerEvent[];
  alerts: FraudAlert[];
  contractAddress: string;
  setRole: (r: Role) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  addChip: (c: Omit<Chip, "history" | "status" | "riskScore" | "riskReasons" | "stage" | "lastTxHash" | "origin">) => void;
  transferOwnership: (chipId: string, newOwner: string, role: string, reason: string) => void;
  advanceStage: (chipId: string, stage: Stage) => void;
  pushLedger: (e: Omit<LedgerEvent, "id" | "timestamp" | "txHash"> & { txHash?: string }) => void;
  pushAlert: (a: Omit<FraudAlert, "id" | "timestamp">) => void;
  simulateCounterfeit: () => string;
}

export const useNexus = create<NexusState>((set, get) => ({
  walletAddress: null,
  network: "Sepolia Testnet",
  role: "vendor",
  chips: seedChips,
  ledger: seedLedger,
  alerts: seedAlerts,
  contractAddress: CONTRACT_ADDRESS,

  setRole: (r) => set({ role: r }),

  connectWallet: async () => {
    try {
      const { address, chainId } = await walletConnect();
      // Switch to Sepolia if needed
      const SEPOLIA = 11155111;
      if (chainId !== SEPOLIA) {
        toast.message("Switching to Sepolia…");
        await switchToSepolia();
      }
      set({ walletAddress: address, network: "Sepolia Testnet" });
      toast.success(`Wallet connected: ${address.slice(0, 6)}…${address.slice(-4)}`);

      // Listen for account/chain changes
      onWalletChange(({ address: a, chainId: cid }) => {
        if (a !== undefined) set({ walletAddress: a || null });
        if (cid !== undefined) {
          set({ network: cid === SEPOLIA ? "Sepolia Testnet" : `Chain ${cid}` });
        }
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to connect wallet");
    }
  },

  disconnectWallet: () => set({ walletAddress: null }),

  addChip: async (c) => {
    if (!get().walletAddress) {
      toast.error("Connect MetaMask first");
      return;
    }
    if (!(await checkNetwork())) {
      toast.error("Please switch MetaMask to Sepolia");
      try { await switchToSepolia(); } catch {}
      return;
    }
    toast.message("Confirm transaction in MetaMask…");
    const r = await registerChipOnChain({
      chipId: c.id,
      batchNumber: c.batch,
      vendorName: c.vendor,
      pufHash: c.pufHash,
      watermarkHash: c.watermarkHash,
      certificateHash: c.certHash,
    });
    if (!r.ok) {
      toast.error(`Register failed: ${r.error}`);
      return;
    }
    const txHash = r.txHash;
    const chip: Chip = {
      ...c,
      origin: "On-chain Sepolia",
      stage: "Registered",
      status: "Authentic",
      riskScore: 8,
      riskReasons: [],
      lastTxHash: txHash,
      history: [{ stage: "Registered", actor: c.vendor, timestamp: Date.now(), txHash }],
    };
    set((s) => ({ chips: [chip, ...s.chips] }));
    get().pushLedger({ type: "Chip Registered", actor: c.owner, chipId: c.id, stage: "Registered", severity: "info", txHash });
    toast.success(`Chip registered on Sepolia. Tx: ${txHash.slice(0, 10)}…`);
  },

  transferOwnership: async (chipId, newOwner, role, reason) => {
    if (!get().walletAddress) {
      toast.error("Connect MetaMask first");
      return;
    }
    if (!(await checkNetwork())) {
      toast.error("Please switch MetaMask to Sepolia");
      try { await switchToSepolia(); } catch {}
      return;
    }
    const chainRole = UI_ROLE_TO_CHAIN[role] ?? "Integrator";
    toast.message("Confirm transfer in MetaMask…");
    const r = await transferOwnershipDirectOnChain(chipId, newOwner, chainRole);
    if (!r.ok) {
      toast.error(`Transfer failed: ${r.error}`);
      return;
    }
    const txHash = r.txHash;
    set((s) => ({
      chips: s.chips.map((c) =>
        c.id === chipId
          ? {
              ...c,
              owner: newOwner,
              lastTxHash: txHash,
              history: [
                ...c.history,
                { stage: "Ownership Released", actor: c.owner, timestamp: Date.now(), txHash, note: reason },
                { stage: "Ownership Acquired", actor: `${role}: ${newOwner}`, timestamp: Date.now(), txHash, note: reason },
              ],
            }
          : c
      ),
    }));
    get().pushLedger({ type: "Ownership Transferred", actor: newOwner, chipId, stage: "Ownership Acquired", severity: "info", txHash });
    toast.success(`Ownership transferred. Tx: ${txHash.slice(0, 10)}…`);
  },

  advanceStage: async (chipId, stage) => {
    if (!get().walletAddress) {
      toast.error("Connect MetaMask first");
      return;
    }
    if (!(await checkNetwork())) {
      toast.error("Please switch MetaMask to Sepolia");
      try { await switchToSepolia(); } catch {}
      return;
    }
    toast.message(`Confirm ${stage} in MetaMask…`);
    const r = await advanceStageOnChain(stage, chipId);
    if (!r.ok) {
      toast.error(`${stage} failed: ${r.error}`);
      return;
    }
    const txHash = r.txHash;
    set((s) => ({
      chips: s.chips.map((c) =>
        c.id === chipId
          ? {
              ...c,
              stage,
              lastTxHash: txHash,
              history: [...c.history, { stage, actor: get().role, timestamp: Date.now(), txHash }],
            }
          : c
      ),
    }));
    get().pushLedger({
      type: stage === "Recycled" ? "Recycled" : (stage as LedgerEvent["type"]),
      actor: get().walletAddress ?? "system",
      chipId,
      stage,
      severity: "info",
      txHash,
    });
    toast.success(`${stage} confirmed. Tx: ${txHash.slice(0, 10)}…`);
  },

  pushLedger: (e) =>
    set((s) => ({
      ledger: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          txHash: e.txHash ?? TX(),
          ...e,
        },
        ...s.ledger,
      ].slice(0, 60),
    })),

  pushAlert: (a) =>
    set((s) => ({
      alerts: [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), ...a },
        ...s.alerts,
      ].slice(0, 30),
    })),

  simulateCounterfeit: () => {
    const fakeId = "NXS-FAKE-" + Math.floor(Math.random() * 9000 + 1000);
    const fake: Chip = {
      id: fakeId,
      batch: "BATCH-COUNTERFEIT",
      vendor: "Unknown Vendor",
      pufHash: HASH("ff"),
      watermarkHash: HASH("ff"),
      certHash: HASH("00"),
      manufactureDate: new Date().toISOString().slice(0, 10),
      owner: SAMPLE_WALLET(99),
      origin: "Unverified",
      stage: "Registered",
      status: "Fake",
      riskScore: 92,
      riskReasons: ["Duplicate chip", "Certificate mismatch", "Failed verification", "Unknown owner"],
      lastTxHash: TX(),
      history: [{ stage: "Registered", actor: "Suspicious", timestamp: Date.now(), txHash: TX() }],
    };
    set((s) => ({ chips: [fake, ...s.chips] }));
    get().pushAlert({
      kind: "Fake chip verification",
      chipId: fakeId,
      detail: "Counterfeit chip injection simulated by Auditor",
    });
    get().pushLedger({
      type: "Fraud Alert",
      actor: "simulator",
      chipId: fakeId,
      severity: "danger",
      message: "Counterfeit chip detected",
    });
    return fakeId;
  },
}));

export const shorten = (s: string | null | undefined, head = 6, tail = 4) =>
  !s ? "—" : s.length <= head + tail ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;

export const fmtTime = (t: number) => {
  const d = new Date(t);
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};
