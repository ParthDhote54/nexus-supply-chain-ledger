import { useNexus, fmtTime } from "@/lib/nexus-store";
import { AlertTriangle } from "lucide-react";
import { SectionCard } from "./SectionCard";

export function FraudPanel() {
  const alerts = useNexus((s) => s.alerts);
  return (
    <SectionCard title="Fraud Alerts" subtitle="Anomalies detected on-chain" icon={<AlertTriangle className="size-4" />}>
      <ul className="space-y-2">
        {alerts.length === 0 && (
          <li className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success-foreground">
            ✓ No active alerts. All chips look healthy.
          </li>
        )}
        {alerts.map((a) => (
          <li key={a.id} className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-destructive">{a.kind}</span>
              <span className="text-[11px] font-mono text-muted-foreground">{fmtTime(a.timestamp)}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Chip <span className="font-mono text-foreground">{a.chipId}</span> — {a.detail}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
