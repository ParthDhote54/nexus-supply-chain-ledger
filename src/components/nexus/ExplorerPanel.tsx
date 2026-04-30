import { useNexus, shorten } from "@/lib/nexus-store";
import { ExternalLink, Boxes } from "lucide-react";
import { SectionCard } from "./SectionCard";

export function ExplorerPanel() {
  const { contractAddress, ledger } = useNexus();
  const latest = ledger[0];
  return (
    <SectionCard title="Blockchain Explorer" subtitle="Etherscan deep links" icon={<Boxes className="size-4" />}>
      <div className="space-y-3">
        <Row label="Contract Address" value={contractAddress} href={`https://sepolia.etherscan.io/address/${contractAddress}`} />
        <Row label="Latest Tx Hash" value={latest?.txHash ?? "—"} href={latest ? `https://sepolia.etherscan.io/tx/${latest.txHash}` : undefined} />
      </div>
    </SectionCard>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white/60 px-3 py-2">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-mono text-xs truncate">{shorten(value, 12, 8)}</div>
      </div>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs hover:bg-primary/5 hover:border-primary/40">
          Etherscan <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}
