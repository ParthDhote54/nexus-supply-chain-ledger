import { useState } from "react";
import { useNexus, shorten } from "@/lib/nexus-store";
import { Search, ShieldCheck } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { ChipPassport } from "./ChipPassport";
import { StatusPill } from "./StatusPill";
import { Field, inputCls, btnPrimary, btnGhost } from "./Field";
import { toast } from "sonner";
import { getChipFromChain } from "@/lib/contract-actions";
import { verifyChipOnChain } from "@/lib/contract-actions";

export function SearchAndVerify() {
  const chips = useNexus((s) => s.chips);
  const pushAlert = useNexus((s) => s.pushAlert);
  const pushLedger = useNexus((s) => s.pushLedger);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<string | null>(null);
  const chip = chips.find((c) => c.id.toLowerCase() === found?.toLowerCase());

  const onSearch = async () => {
    const id = q.trim();
    // Try local ledger first (fast path)
    const local = chips.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (local) {
      setFound(local.id);
      toast.success(`Chip ${local.id} found (local + on-chain)`);
      return;
    }
    // Fallback: query Sepolia contract directly
    try {
      const onchain = await getChipFromChain(id);
      if (onchain) {
        toast.success(`Chip ${onchain.chipId} found on-chain`);
        toast.message(`Owner ${onchain.currentOwner.slice(0, 10)}… stage ${onchain.stage}`);
      } else {
        setFound(null);
        toast.error("Chip not found in ledger or on-chain");
      }
    } catch (err: any) {
      setFound(null);
      toast.error(err?.message ?? "On-chain lookup failed");
    }
  };

  const onVerify = async () => {
    if (!chip) return toast.error("Search a chip first");
    if (chip.status !== "Authentic" || chip.riskScore >= 40) {
      toast.error(`✗ ${chip.id} failed verification — ${chip.status}`);
      pushAlert({ kind: "Fake chip verification", chipId: chip.id, detail: `Status=${chip.status}, risk=${chip.riskScore}` });
      return;
    }
    toast.message("Confirm verification in MetaMask…");
    const r = await verifyChipOnChain(chip.id);
    if (!r.ok) {
      toast.error(`Verification tx failed: ${r.error}`);
      return;
    }
    toast.success(`✓ ${chip.id} verified on-chain. Tx: ${r.txHash.slice(0, 10)}…`);
    pushLedger({ type: "Verified", actor: "auditor", chipId: chip.id, stage: "Verified", severity: "info", txHash: r.txHash });
  };

  return (
    <SectionCard title="Search & Verify Chip" subtitle="Lookup any chip ID across the ledger" icon={<Search className="size-4" />}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Chip ID">
            <input className={inputCls} placeholder="e.g. NXS-A1-00421" value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
        </div>
        <button className={btnPrimary} onClick={onSearch}><Search className="size-4" />Search Chip</button>
        <button className={btnGhost} onClick={onVerify}><ShieldCheck className="size-4" />Verify Chip</button>
      </div>

      {chip && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Status" value={<StatusPill status={chip.status} />} />
            <Stat label="Owner" value={<span className="font-mono text-sm">{shorten(chip.owner)}</span>} />
            <Stat label="Stage" value={<span className="text-sm font-medium">{chip.stage}</span>} />
            <Stat label="Risk" value={<span className="text-sm font-semibold tabular-nums">{chip.riskScore}/100</span>} />
          </div>
          <div className="text-xs text-muted-foreground">
            Last tx: <a className="font-mono text-primary hover:underline" href={`https://sepolia.etherscan.io/tx/${chip.lastTxHash}`} target="_blank" rel="noreferrer">{chip.lastTxHash}</a>
          </div>
          <ChipPassport chip={chip} />
        </div>
      )}
    </SectionCard>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
