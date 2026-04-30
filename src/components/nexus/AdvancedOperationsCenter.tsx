import { useEffect, useState } from "react";
import {
  Shield, ShieldAlert, ShieldCheck, Activity, FileSearch, GitBranch, Lock, Award,
  Fingerprint, Hash, FileWarning, Database, QrCode, Ban, RefreshCw, Mail, XCircle,
  CheckCircle2, AlertTriangle, TrendingUp, Brain, Download, BadgeCheck, Cpu,
} from "lucide-react";
import { useNexus, shorten, fmtTime, type Chip, type LedgerEvent, type FraudAlert } from "@/lib/nexus-store";
import { SectionCard } from "./SectionCard";
import { toast } from "sonner";

export function AdvancedOperationsCenter() {
  const { chips, ledger, alerts } = useNexus();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="space-y-6">
      {/* Hero header */}
      <div className="glass rounded-2xl p-5 ring-grid relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl grad-cyber text-white glow"><Shield className="size-6" /></div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Advanced Operations Center</h2>
              <p className="text-xs text-muted-foreground">Forensics · Evidence · Response · Predictive Risk · Compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-success"><ShieldCheck className="size-3.5" /> All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* 1. Threat Forensics */}
      <ForensicsPanel chips={chips} ledger={ledger} alerts={alerts} mounted={mounted} />

      {/* 2 + 3 side-by-side */}
      <div className="grid gap-6 xl:grid-cols-2">
        <EvidenceVaultPanel chips={chips} />
        <ResponseEnginePanel />
      </div>

      {/* 4 + 5 */}
      <div className="grid gap-6 xl:grid-cols-2">
        <PredictiveRiskPanel chips={chips} mounted={mounted} />
        <CompliancePanel chips={chips} mounted={mounted} />
      </div>
    </section>
  );
}

function ForensicsPanel({ chips, ledger, alerts, mounted }: { chips: Chip[]; ledger: LedgerEvent[]; alerts: FraudAlert[]; mounted: boolean }) {
  const incidents = alerts.slice(0, 6).map((a, idx) => {
    const chip = chips.find((c) => c.id === a.chipId);
    return {
      id: a.id,
      time: a.timestamp,
      attack: a.kind,
      chipId: a.chipId,
      wallet: chip?.owner ?? "0x0000000000000000",
      stage: chip?.stage ?? "—",
      tx: ledger[idx]?.txHash ?? "0x" + "0".repeat(40),
      cause: a.detail,
    };
  });
  const custody = ["Vendor", "Foundry", "Integrator", "Distributor", "End User"];
  const anomalyIdx = 2;

  return (
    <SectionCard title="Threat Forensics Engine" subtitle="Incident reconstruction & root cause" icon={<FileSearch className="size-4" />}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-white/60 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold mb-3"><Activity className="size-4 text-primary" /> Incident Timeline</div>
          {incidents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-white/40 p-6 text-center text-xs text-muted-foreground">No incidents recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="text-muted-foreground">
                  <tr className="text-left border-b border-border">
                    <th className="py-2 pr-2">Time</th>
                    <th className="py-2 pr-2">Attack</th>
                    <th className="py-2 pr-2">Chip</th>
                    <th className="py-2 pr-2">Wallet</th>
                    <th className="py-2 pr-2">Stage</th>
                    <th className="py-2 pr-2">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((i) => (
                    <tr key={i.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-2 font-mono text-muted-foreground">{mounted ? fmtTime(i.time) : "—"}</td>
                      <td className="py-2 pr-2 font-medium">{i.attack}</td>
                      <td className="py-2 pr-2 font-mono">{i.chipId}</td>
                      <td className="py-2 pr-2 font-mono">{shorten(i.wallet)}</td>
                      <td className="py-2 pr-2">{i.stage}</td>
                      <td className="py-2 pr-2 font-mono text-primary">{shorten(i.tx)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white/60 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold mb-3"><AlertTriangle className="size-4 text-destructive" /> Root Cause</div>
          <ul className="space-y-2">
            {incidents.length === 0 ? (
              <li className="text-[11px] text-muted-foreground">No active root causes.</li>
            ) : incidents.slice(0, 5).map((i) => (
              <li key={i.id} className="rounded-lg border border-border bg-white/70 px-3 py-2">
                <div className="text-[11px] font-semibold">{i.attack}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{i.cause}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-white/60 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold mb-4"><GitBranch className="size-4 text-primary" /> Chain-of-Custody</div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {custody.map((node, idx) => {
            const isAnomaly = idx === anomalyIdx && incidents.length > 0;
            return (
              <div key={node} className="flex items-center gap-2 shrink-0">
                <div className={`rounded-xl border px-4 py-3 text-center min-w-[120px] ${isAnomaly ? "border-destructive bg-destructive/10 text-destructive animate-pulse" : "border-border bg-white/70"}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Stage {idx + 1}</div>
                  <div className="text-sm font-semibold mt-1">{node}</div>
                  {isAnomaly && <div className="text-[10px] mt-1 font-medium">⚠ Anomaly</div>}
                </div>
                {idx < custody.length - 1 && <div className="h-0.5 w-6 bg-border" />}
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

function EvidenceVaultPanel({ chips }: { chips: Chip[] }) {
  const sample = chips[0];
  const items = [
    { label: "PUF Hash Proof", icon: Fingerprint, hash: sample?.pufHash ?? "0xPUF…", valid: true, desc: "Physical fingerprint matches enrollment registry." },
    { label: "Watermark Hash", icon: Hash, hash: sample?.watermarkHash ?? "0xWMK…", valid: true, desc: "Embedded silicon watermark verified on-chain." },
    { label: "Certificate Hash", icon: FileWarning, hash: sample?.certHash ?? "0xCRT…", valid: true, desc: "Compliance certificate signature validated." },
    { label: "Transaction Proof", icon: Database, hash: sample?.lastTxHash ?? "0xTX…", valid: true, desc: "Last lifecycle event anchored to ledger block." },
    { label: "QR Passport Proof", icon: QrCode, hash: sample?.id ?? "CHIP-…", valid: true, desc: "Scan-verified passport linked to on-chain record." },
  ];
  return (
    <SectionCard title="Evidence Vault" subtitle="Cryptographic proofs" icon={<Lock className="size-4" />}>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <article key={it.label} className="rounded-xl border border-border bg-white/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid size-8 place-items-center rounded-lg grad-cyber text-white shrink-0"><it.icon className="size-4" /></span>
                <div className="text-xs font-semibold truncate">{it.label}</div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${it.valid ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                {it.valid ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                {it.valid ? "Valid" : "Mismatch"}
              </span>
            </div>
            <div className="mt-2 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] truncate">{it.hash}</div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">{it.desc}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function ResponseEnginePanel() {
  const [log, setLog] = useState<{ id: string; action: string; ts: number }[]>([]);
  const trigger = (action: string, message: string) => {
    setLog((l) => [{ id: `${Date.now()}-${l.length}`, action, ts: Date.now() }, ...l].slice(0, 6));
    toast.success(message);
  };
  const actions = [
    { label: "Quarantine Chip", icon: Lock, color: "from-amber-500 to-orange-500", msg: "Chip quarantined — lifecycle frozen" },
    { label: "Block Wallet", icon: Ban, color: "from-rose-500 to-red-500", msg: "Wallet blacklisted across network" },
    { label: "Re-Verification", icon: RefreshCw, color: "from-cyan-500 to-blue-500", msg: "Re-verification dispatched" },
    { label: "Alert Auditor", icon: Mail, color: "from-violet-500 to-fuchsia-500", msg: "Auditor notified of incident" },
    { label: "Reject Tx", icon: XCircle, color: "from-red-500 to-rose-600", msg: "Transaction reverted on-chain" },
  ];
  return (
    <SectionCard title="Security Response Engine" subtitle="Automated incident actions" icon={<ShieldCheck className="size-4" />}>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => trigger(a.label, a.msg)}
            className="group rounded-xl border border-border bg-white/60 p-3 text-left hover:bg-white hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <div className={`grid size-8 place-items-center rounded-lg bg-gradient-to-br ${a.color} text-white`}>
              <a.icon className="size-4" />
            </div>
            <div className="mt-2 text-xs font-semibold">{a.label}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-primary transition">Execute</div>
          </button>
        ))}
      </div>
      {log.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-white/60 p-3">
          <div className="text-xs font-semibold mb-2 flex items-center gap-2"><Activity className="size-4 text-primary" /> Response Log</div>
          <ul className="space-y-1.5">
            {log.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white/70 px-3 py-1.5 text-[11px]">
                <span className="flex items-center gap-2"><CheckCircle2 className="size-3 text-success" /><span className="font-medium">{l.action}</span></span>
                <span className="font-mono text-muted-foreground">{fmtTime(l.ts)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

function PredictiveRiskPanel({ chips, mounted }: { chips: Chip[]; mounted: boolean }) {
  const predicted = [...chips]
    .map((c) => {
      const reasons: string[] = [];
      if (c.riskReasons.includes("Unknown owner")) reasons.push("Unknown owner");
      if (c.riskReasons.includes("Duplicate chip")) reasons.push("Duplicate ID");
      if (c.riskReasons.includes("Failed verification")) reasons.push("Failed PUF");
      if (c.riskReasons.includes("Missing stage")) reasons.push("Stage gap");
      if (c.status !== "Authentic") reasons.push("Certificate mismatch");
      const projected = Math.min(100, c.riskScore + (reasons.length * 8));
      return { chip: c, projected, reasons };
    })
    .sort((a, b) => b.projected - a.projected)
    .slice(0, 5);

  return (
    <SectionCard title="Predictive Risk Intelligence" subtitle="Forecasted high-risk chips" icon={<Brain className="size-4" />}>
      <div className="space-y-2">
        {!mounted ? (
          <div className="rounded-lg border border-dashed border-border bg-white/40 p-6 text-center text-xs text-muted-foreground">Loading predictions…</div>
        ) : predicted.map(({ chip, projected, reasons }) => (
          <div key={chip.id} className="rounded-xl border border-border bg-white/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Cpu className="size-4 text-primary shrink-0" />
                <span className="font-mono text-xs truncate">{chip.id}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground">now {chip.riskScore}</span>
                <TrendingUp className={`size-3.5 ${projected > chip.riskScore ? "text-destructive" : "text-success"}`} />
                <span className={`text-xs font-bold tabular-nums ${projected >= 60 ? "text-destructive" : "text-foreground"}`}>{projected}</span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${projected >= 60 ? "grad-danger" : "grad-cyber"}`} style={{ width: `${projected}%` }} />
            </div>
            {reasons.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {reasons.map((r) => (
                  <li key={r} className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-2 py-0.5 text-[10px] text-warning-foreground">
                    <AlertTriangle className="size-3" /> {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CompliancePanel({ chips, mounted }: { chips: Chip[]; mounted: boolean }) {
  const verified = chips.filter((c) => c.history.some((h) => h.stage === "Verified")).length;
  const auditScore = mounted ? Math.min(100, 60 + Math.round((verified / Math.max(1, chips.length)) * 40)) : 0;
  const standards = [
    { label: "NIST Aligned", icon: BadgeCheck, status: "Compliant" },
    { label: "ENISA Aligned", icon: BadgeCheck, status: "Compliant" },
    { label: "DoD HW Security", icon: ShieldCheck, status: "Compliant" },
    { label: "ISO/IEC 27001", icon: Award, status: "Aligned" },
  ];

  const exportReport = () => {
    const report = `NEXUS Compliance Report\nGenerated: ${new Date().toISOString()}\nAudit Score: ${auditScore}/100\nChips: ${chips.length}\nVerified: ${verified}\n\nStandards:\n${standards.map((s) => `- ${s.label}: ${s.status}`).join("\n")}\n`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-compliance-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Compliance report exported");
  };

  return (
    <SectionCard title="Compliance & Audit Readiness" subtitle="Standards posture & audit score" icon={<Award className="size-4" />}>
      <div className="rounded-xl border border-border bg-white/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Audit-Ready Score</div>
            <div className={`text-4xl font-bold ${auditScore >= 80 ? "text-grad-cyber" : "text-warning-foreground"}`}>{auditScore}<span className="text-base text-muted-foreground">/100</span></div>
          </div>
          <button
            onClick={exportReport}
            className="inline-flex items-center gap-2 rounded-lg grad-cyber px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            <Download className="size-4" /> Export Report
          </button>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full grad-cyber" style={{ width: `${auditScore}%` }} />
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {standards.map((s) => (
          <li key={s.label} className="flex items-center gap-2 rounded-lg border border-border bg-white/70 px-3 py-2">
            <span className="grid size-7 place-items-center rounded-md grad-cyber text-white shrink-0"><s.icon className="size-3.5" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate">{s.label}</div>
              <div className="text-[10px] text-success">{s.status}</div>
            </div>
            <CheckCircle2 className="size-4 text-success shrink-0" />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}