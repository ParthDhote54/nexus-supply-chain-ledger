import { useNexus, shorten } from "@/lib/nexus-store";
import { SectionCard } from "../SectionCard";
import { StatusPill } from "../StatusPill";
import { AnalyticsPanel } from "../AnalyticsPanel";
import { FraudPanel } from "../FraudPanel";
import { LedgerFeed } from "../LedgerFeed";
import { ExplorerPanel } from "../ExplorerPanel";
import { ROLES } from "@/lib/nexus-store";
import { btnPrimary, btnGhost } from "../Field";
import { Database, AlertOctagon, Users, FileBadge2, Download, Bug } from "lucide-react";
import { toast } from "sonner";

export function AuditorDashboard() {
  const { chips, simulateCounterfeit } = useNexus();
  const suspicious = chips.filter((c) => c.riskScore >= 60 || c.status !== "Authentic");

  const onExport = () => {
    const rows = ["chip_id,vendor,owner,stage,status,risk,last_tx", ...chips.map((c) =>
      `${c.id},${c.vendor},${c.owner},${c.stage},${c.status},${c.riskScore},${c.lastTxHash}`
    )].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "nexus-audit-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit report exported");
  };

  const onSimulate = () => {
    const id = simulateCounterfeit();
    toast.error(`Counterfeit chip injected: ${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="All Chips"
            subtitle={`${chips.length} chips on ledger`}
            icon={<Database className="size-4" />}
            action={
              <div className="flex gap-2">
                <button className={btnGhost} onClick={onSimulate}><Bug className="size-4" />Simulate Fake Chip</button>
                <button className={btnPrimary} onClick={onExport}><Download className="size-4" />Export Audit</button>
              </div>
            }
          >
            <ChipTable chips={chips} />
          </SectionCard>

          <SectionCard title="Suspicious Chips" subtitle="High-risk or unverified" icon={<AlertOctagon className="size-4" />}>
            <ChipTable chips={suspicious} highlight />
          </SectionCard>

          <AnalyticsPanel />
        </div>

        <div className="space-y-6">
          <SectionCard title="Stakeholders" subtitle="Active roles on this network" icon={<Users className="size-4" />}>
            <ul className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <li key={r.id} className="rounded-lg border border-border bg-white/60 px-3 py-2 text-xs">
                  <div className="font-medium">{r.label}</div>
                  <div className="font-mono text-muted-foreground">{r.short}</div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Compliance Certificates" subtitle="On-chain certificate hashes" icon={<FileBadge2 className="size-4" />}>
            <ul className="space-y-1.5 text-xs">
              {chips.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white/60 px-3 py-1.5">
                  <span className="font-mono">{c.id}</span>
                  <span className="font-mono text-muted-foreground">{shorten(c.certHash, 8, 6)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <FraudPanel />
          <ExplorerPanel />
          <LedgerFeed limit={8} />
        </div>
      </div>
    </div>
  );
}

function ChipTable({ chips, highlight }: { chips: ReturnType<typeof useNexus.getState>["chips"]; highlight?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white/60">
      <table className="w-full text-xs">
        <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2">Chip ID</th>
            <th className="text-left px-3 py-2">Vendor</th>
            <th className="text-left px-3 py-2">Owner</th>
            <th className="text-left px-3 py-2">Stage</th>
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-right px-3 py-2">Risk</th>
            <th className="text-left px-3 py-2">Last Tx</th>
          </tr>
        </thead>
        <tbody>
          {chips.length === 0 && (
            <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No chips</td></tr>
          )}
          {chips.map((c) => (
            <tr key={c.id} className={`border-b border-border/60 ${highlight ? "bg-destructive/5" : ""}`}>
              <td className="px-3 py-2 font-mono">{c.id}</td>
              <td className="px-3 py-2">{c.vendor}</td>
              <td className="px-3 py-2 font-mono">{shorten(c.owner)}</td>
              <td className="px-3 py-2">{c.stage}</td>
              <td className="px-3 py-2"><StatusPill status={c.status} /></td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">{c.riskScore}</td>
              <td className="px-3 py-2"><a className="font-mono text-primary hover:underline" href={`https://sepolia.etherscan.io/tx/${c.lastTxHash}`} target="_blank" rel="noreferrer">{shorten(c.lastTxHash, 6, 4)}</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
