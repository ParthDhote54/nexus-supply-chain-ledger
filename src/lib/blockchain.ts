// Wallet / provider / contract plumbing for the NEXUS frontend.
// Uses ethers v6 + window.ethereum (MetaMask).
//
// Install in the frontend:    npm install ethers
//
// All functions are safe to import from React components.

import { BrowserProvider, JsonRpcSigner, Contract } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS, CHAIN_ID, NETWORK_NAME } from "./contract-config";

// ---- Types ----
export type RoleEnum =
  | "None"
  | "Vendor"
  | "Integrator"
  | "Foundry"
  | "Distributor"
  | "EndUser"
  | "Recycler"
  | "Auditor"
  | "Admin";

export type StageEnum =
  | "None"
  | "Registered"
  | "OwnershipReleased"
  | "OwnershipAcquired"
  | "Integrated"
  | "Manufactured"
  | "Distributed"
  | "Verified"
  | "Recycled";

const ROLE_ORDER: RoleEnum[] = [
  "None",
  "Vendor",
  "Integrator",
  "Foundry",
  "Distributor",
  "EndUser",
  "Recycler",
  "Auditor",
  "Admin",
];

const STAGE_ORDER: StageEnum[] = [
  "None",
  "Registered",
  "OwnershipReleased",
  "OwnershipAcquired",
  "Integrated",
  "Manufactured",
  "Distributed",
  "Verified",
  "Recycled",
];

export function parseContractRole(roleId: number | bigint): RoleEnum {
  const i = Number(roleId);
  return ROLE_ORDER[i] ?? "None";
}

export function parseContractStage(stageId: number | bigint): StageEnum {
  const i = Number(stageId);
  return STAGE_ORDER[i] ?? "None";
}

export function roleNameToId(name: RoleEnum): number {
  return Math.max(0, ROLE_ORDER.indexOf(name));
}

export function shortenAddress(addr?: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ---- Wallet / network helpers ----
declare global {
  interface Window {
    ethereum?: any;
  }
}

function ensureEthereum(): any {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected. Install MetaMask to continue.");
  }
  return window.ethereum;
}

export function getProvider(): BrowserProvider {
  return new BrowserProvider(ensureEthereum());
}

export async function getSigner(): Promise<JsonRpcSigner> {
  const provider = getProvider();
  return provider.getSigner();
}

export async function connectWallet(): Promise<{ address: string; chainId: number }> {
  const eth = ensureEthereum();
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  const provider = new BrowserProvider(eth);
  const network = await provider.getNetwork();
  return { address: accounts[0], chainId: Number(network.chainId) };
}

export async function checkNetwork(): Promise<boolean> {
  const provider = getProvider();
  const network = await provider.getNetwork();
  return Number(network.chainId) === CHAIN_ID;
}

export async function switchToSepolia(): Promise<void> {
  const eth = ensureEthereum();
  const hexId = "0x" + CHAIN_ID.toString(16);
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (err: any) {
    // 4902 = chain not added
    if (err?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexId,
            chainName: NETWORK_NAME,
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function getContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as unknown as any, signer);
}

export async function getReadOnlyContract(): Promise<Contract> {
  const provider = getProvider();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as unknown as any, provider);
}

// Subscribe to MetaMask account/chain changes.
// Returns an unsubscribe function.
export function onWalletChange(cb: (state: { address?: string; chainId?: number }) => void): () => void {
  const eth = (typeof window !== "undefined" && window.ethereum) || null;
  if (!eth?.on) return () => {};
  const onAccounts = (accs: string[]) => cb({ address: accs?.[0] });
  const onChain = (hex: string) => cb({ chainId: parseInt(hex, 16) });
  eth.on("accountsChanged", onAccounts);
  eth.on("chainChanged", onChain);
  return () => {
    eth.removeListener?.("accountsChanged", onAccounts);
    eth.removeListener?.("chainChanged", onChain);
  };
}
