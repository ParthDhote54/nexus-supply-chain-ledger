// High-level frontend actions that the existing UI buttons can call.
// Each function returns a normalized result so the UI does not need to know about ethers.
//
// Example:
//   const r = await registerChipOnChain({ chipId, batchNumber, vendorName, pufHash, watermarkHash, certificateHash });
//   if (r.ok) toast(`Tx: ${r.txHash}`);

import { getContract, getReadOnlyContract, parseContractRole, parseContractStage, roleNameToId, RoleEnum, StageEnum } from "./blockchain";

export type TxResult = { ok: true; txHash: string } | { ok: false; error: string };

async function runTx(callable: () => Promise<any>): Promise<TxResult> {
  try {
    const tx = await callable();
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    const msg =
      err?.shortMessage ||
      err?.reason ||
      err?.data?.message ||
      err?.message ||
      "Transaction failed";
    return { ok: false, error: msg };
  }
}

// ---------- Registration ----------
export async function registerChipOnChain(input: {
  chipId: string;
  batchNumber: string;
  vendorName: string;
  pufHash: string;
  watermarkHash: string;
  certificateHash: string;
}): Promise<TxResult> {
  const c = await getContract();
  return runTx(() =>
    c.registerChip(
      input.chipId,
      input.batchNumber,
      input.vendorName,
      input.pufHash,
      input.watermarkHash,
      input.certificateHash
    )
  );
}

// ---------- Ownership ----------
export async function releaseOwnershipOnChain(chipId: string, newOwner: string, newOwnerRole: RoleEnum = "Integrator"): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.releaseOwnership(chipId, newOwner, roleNameToId(newOwnerRole)));
}

export async function acquireOwnershipOnChain(chipId: string): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.acquireOwnership(chipId));
}

export async function transferOwnershipDirectOnChain(chipId: string, newOwner: string, newOwnerRole: RoleEnum = "Integrator"): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.transferOwnershipDirect(chipId, newOwner, roleNameToId(newOwnerRole)));
}

// ---------- Lifecycle ----------
export async function integrateChipOnChain(chipId: string): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.integrateChip(chipId));
}

export async function manufactureChipOnChain(chipId: string): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.manufactureChip(chipId));
}

export async function distributeChipOnChain(chipId: string): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.distributeChip(chipId));
}

export async function recycleChipOnChain(chipId: string): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.recycleChip(chipId));
}

// ---------- Auditor / Admin ----------
export async function verifyChipOnChain(chipId: string): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.verifyChip(chipId));
}

export async function flagChipOnChain(chipId: string, flagged: boolean): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.flagChip(chipId, flagged));
}

export async function updateRiskScoreOnChain(chipId: string, score: number): Promise<TxResult> {
  const c = await getContract();
  return runTx(() => c.updateRiskScore(chipId, score));
}

// ---------- Reads ----------
export interface ChipOnChain {
  chipId: string;
  batchNumber: string;
  vendorName: string;
  pufHash: string;
  watermarkHash: string;
  certificateHash: string;
  currentOwner: string;
  pendingOwner: string;
  registeredBy: string;
  lastUpdatedBy: string;
  currentOwnerRole: RoleEnum;
  pendingOwnerRole: RoleEnum;
  stage: StageEnum;
  exists: boolean;
  verified: boolean;
  flagged: boolean;
  riskScore: number;
  registeredAt: number;
  updatedAt: number;
}

export async function getChipFromChain(chipId: string): Promise<ChipOnChain | null> {
  try {
    const c = await getReadOnlyContract();
    const exists = await c.chipExists(chipId);
    if (!exists) return null;
    const r: any = await c.getChip(chipId);
    return {
      chipId: r.chipId,
      batchNumber: r.batchNumber,
      vendorName: r.vendorName,
      pufHash: r.pufHash,
      watermarkHash: r.watermarkHash,
      certificateHash: r.certificateHash,
      currentOwner: r.currentOwner,
      pendingOwner: r.pendingOwner,
      registeredBy: r.registeredBy,
      lastUpdatedBy: r.lastUpdatedBy,
      currentOwnerRole: parseContractRole(r.currentOwnerRole),
      pendingOwnerRole: parseContractRole(r.pendingOwnerRole),
      stage: parseContractStage(r.stage),
      exists: r.exists,
      verified: r.verified,
      flagged: r.flagged,
      riskScore: Number(r.riskScore),
      registeredAt: Number(r.registeredAt),
      updatedAt: Number(r.updatedAt),
    };
  } catch (err) {
    console.error("getChipFromChain error", err);
    return null;
  }
}
