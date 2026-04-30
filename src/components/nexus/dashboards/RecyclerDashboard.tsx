import { StageOps } from "../StageOps";
import { SearchAndVerify } from "../SearchAndVerify";
import { LedgerFeed } from "../LedgerFeed";
import { FraudPanel } from "../FraudPanel";
import { SectionCard } from "../SectionCard";
import { Recycle } from "lucide-react";
import { useNexus } from "@/lib/nexus-store";

export function RecyclerDashboard() {
  const chips = useNexus((s) => s.chips);
  const recycled = chips.filter((c) => c.stage === "Recycled");
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <StageOps allowed={["Recycled"]} />
        <SectionCard title="Recycled / Retired Chips" subtitle="End-of-life records" icon={<Recycle className="size-4" />}>
          <ul className="space-y-2">
            {recycled.length === 0 && <li className="text-sm text-muted-foreground">No retired chips yet.</li>}
            {recycled.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-white/60 px-3 py-2 text-sm">
                <span className="font-mono">{c.id}</span>
                <span className="text-muted-foreground">{c.vendor}</span>
                <span className="text-xs grad-success rounded-full px-2 py-0.5 text-white">Retired</span>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SearchAndVerify />
      </div>
      <div className="space-y-6">
        <FraudPanel />
        <LedgerFeed limit={8} />
      </div>
    </div>
  );
}
