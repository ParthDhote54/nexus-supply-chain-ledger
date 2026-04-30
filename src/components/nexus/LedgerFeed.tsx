import { useNexus, shorten, fmtTime } from "@/lib/nexus-store";
import { Activity, AlertTriangle, ArrowLeftRight, CheckCircle2, Cpu, Factory, Recycle, Truck } from "lucide-react";
import { SectionCard } from "./SectionCard";

const ICON = {
  "Chip Registered": Cpu,
  "Ownership Transferred": ArrowLeftRight,
  "Integrated": Factory,
  "Manufactured": Factory,
  "Distributed": Truck,
  "Verified": CheckCircle2,
  "Recycled": Recycle,
  "Fraud Alert": AlertTriangle,
} as const;

export function LedgerFeed({ limit = 12 }: { limit?: number }) {
  const ledger = useNexus((s) => s.ledger);
  return (
    <SectionCard title="Live Blockchain Ledger" subtitle="Real-time on-chain events" icon={<Activity className="size-4" />}>
      <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {ledger.slice(0, limit).map((e) => {
          const Icon = ICON[e.type];
          const danger = e.severity === "danger";
          return (
            <li
              key={e.id}
              className={`animate-ledger-in flex items-start gap-3 rounded-xl border p-3 ${
                danger ? "border-destructive/30 bg-destructive/5" : "border-border bg-white/60"
              }`}
            >
              <div className={`grid size-9 place-items-center rounded-lg shrink-0 ${danger ? "grad-danger" : "grad-cyber"} text-white`}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate">{e.type}</span>
                  <span className="text-[11px] text-muted-foreground font-mono shrink-0">{fmtTime(e.timestamp)}</span>
                </div>
                <div className="mt-0.5 grid gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground sm:grid-cols-2">
                  {e.chipId && <span>Chip: <span className="font-mono text-foreground">{e.chipId}</span></span>}
                  {e.stage && <span>Stage: <span className="text-foreground">{e.stage}</span></span>}
                  <span>Actor: <span className="font-mono text-foreground">{shorten(e.actor)}</span></span>
                  <span>Tx: <a className="font-mono text-primary hover:underline" href={`https://sepolia.etherscan.io/tx/${e.txHash}`} target="_blank" rel="noreferrer">{shorten(e.txHash, 8, 6)}</a></span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
