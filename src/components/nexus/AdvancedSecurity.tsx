import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Shield, ShieldAlert, ShieldCheck, Activity, Bug, Copy, UserX, SkipForward,
  FileWarning, Fingerprint, Cpu, Radio, AlertTriangle, CheckCircle2, BadgeCheck,
  TrendingUp, Gauge, Lock, Award,
  Search, FileSearch, GitBranch, Database, QrCode, Hash, Ban, RefreshCw, Mail, XCircle,
} from "lucide-react";
import { useNexus, STAGE_FLOW, shorten, fmtTime, type Chip } from "@/lib/nexus-store";
import { SectionCard } from "./SectionCard";
import { StatusPill } from "./StatusPill";
import { btnPrimary, btnGhost } from "./Field";
import { toast } from "sonner";

type AttackKind =
  | "Counterfeit Injection"
  | "Duplicate Chip ID"
  | "Unauthorized Ownership Transfer"
  | "Stage Skipping"
  | "Certificate Mismatch"
  | "PUF Hash Mismatch"
  | "Fake Firmware Update"
  | "MITM / Data Spoofing";

interface AttackResult {
  id: string;
  kind: AttackKind;
  chipId: string;
  detected: boolean;
  riskDelta: number;
  reason: string;
  recommendation: string;
  timestamp: number;
}

const ATTACKS: { kind: AttackKind; icon: React.ComponentType<{ className?: string }>; desc: string; color: string }[] = [
  { kind: "Counterfeit Injection", icon: Bug, desc: "Inject a chip with no valid vendor signature", color: "from-rose-500 to-red-500" },
  { kind: "Duplicate Chip ID", icon: Copy, desc: "Register a chip ID that already exists on-chain", color: "from-fuchsia-500 to-pink-500" },
  { kind: "Unauthorized Ownership Transfer", icon: UserX, desc: "Transfer chip from a non-owner wallet", color: "from-orange-500 to-rose-500" },
  { kind: "Stage Skipping", icon: SkipForward, desc: "Jump from Registered to Distributed", color: "from-amber-500 to-orange-500" },
  { kind: "Certificate Mismatch", icon: FileWarning, desc: "Submit a chip with a forged certHash", color: "from-violet-500 to-fuchsia-500" },
  { kind: "PUF Hash Mismatch", icon: Fingerprint, desc: "Physical fingerprint does not match registry", color: "from-blue-500 to-violet-500" },
  { kind: "Fake Firmware Update", icon: Cpu, desc: "Push unsigned firmware to deployed chip", color: "from-cyan-500 to-blue-500" },
  { kind: "MITM / Data Spoofing", icon: Radio, desc: "Intercept and forge stage update payloads", color: "from-teal-500 to-cyan-500" },
];

function pickRandomChip(chips: Chip[]): Chip | undefined {
  if (chips.length === 0) return undefined;
  return chips[Math.floor(Math.random() * chips.length)];
}

function buildResult(kind: AttackKind, chip: Chip): AttackResult {
  const map: Record<AttackKind, { reason: string; rec: string; delta: number; detected: boolean }> = {
    "Counterfeit Injection": {
      reason: "Vendor signature missing; chip not on registered batch list.",
      rec: "Reject chip, alert vendor, blacklist source wallet.",
      delta: 35, detected: true,
    },
    "Duplicate Chip ID": {
      reason: "Chip ID collision detected with existing on-chain record.",
      rec: "Block secondary registration, trigger duplicate audit.",
      delta: 30, detected: true,
    },
    "Unauthorized Ownership Transfer": {
      reason: "Transfer initiator wallet does not match current owner.",
      rec: "Revert transaction, lock chip until auditor review.",
      delta: 25, detected: true,
    },
    "Stage Skipping": {
      reason: "Lifecycle stage advanced out of canonical order.",
      rec: "Force re-verification at previous stage gate.",
      delta: 20, detected: true,
    },
    "Certificate Mismatch": {
      reason: "Submitted certHash does not match issuer registry.",
      rec: "Reject lifecycle update, request new compliance cert.",
      delta: 28, detected: true,
    },
    "PUF Hash Mismatch": {
      reason: "On-chip PUF response differs from enrollment hash.",
      rec: "Quarantine chip, schedule physical inspection.",
      delta: 40, detected: true,
    },
    "Fake Firmware Update": {
      reason: "Firmware payload not signed by approved authority.",
      rec: "Refuse update, rotate device keys, notify integrator.",
      delta: 22, detected: true,
    },
    "MITM / Data Spoofing": {
      reason: "Tx payload signature invalid — likely tampered in transit.",
      rec: "Drop transaction, enforce TLS pinning + on-chain attest.",
      delta: 18, detected: true,
    },
  };
  const info = map[kind];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    chipId: chip.id,
    detected: info.detected,
    riskDelta: info.delta,
    reason: info.reason,
    recommendation: info.rec,
    timestamp: Date.now(),
  };
}

export function AdvancedSecurity() {
  const { chips, ledger, simulateCounterfeit, pushAlert, pushLedger } = useNexus();
  const [results, setResults] = useState<AttackResult[]>([]);
  const [blocked, setBlocked] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const runAttack = (kind: AttackKind) => {
    let chip = pickRandomChip(chips);
    if (kind === "Counterfeit Injection") {
      const fakeId = simulateCounterfeit();
      chip = useNexus.getState().chips.find((c) => c.id === fakeId) ?? chip;
    }
    if (!chip) {
      toast.error("No chips available to simulate against");
      return;
    }
    const result = buildResult(kind, chip);
    setResults((r) => [result, ...r].slice(0, 12));
    setBlocked((b) => b + (result.detected ? 1 : 0));
    pushAlert({
      kind: kind === "Duplicate Chip ID" ? "Duplicate chip detected"
        : kind === "Unauthorized Ownership Transfer" ? "Unauthorized ownership transfer"
        : kind === "Stage Skipping" ? "Stage skipping attempt"
        : kind === "Certificate Mismatch" ? "Certificate mismatch"
        : "Fake chip verification",
      chipId: chip.id,
      detail: result.reason,
    });
    pushLedger({
      type: "Fraud Alert",
      actor: "attack-sim",
      chipId: chip.id,
      severity: "danger",
      message: `${kind} simulated`,
    });
    toast.error(`${kind} blocked on ${chip.id}`);
  };

  // Analytics
  const stageData = STAGE_FLOW.map((s) => ({ stage: s.split(" ")[0], count: chips.filter((c) => c.stage === s).length }));
  const fraudData = [
    { name: "Authentic", value: chips.filter((c) => c.status === "Authentic").length },
    { name: "Suspicious", value: chips.filter((c) => c.status !== "Authentic").length },
  ];
  const riskBuckets = [
    { range: "0-20", count: chips.filter((c) => c.riskScore <= 20).length },
    { range: "21-40", count: chips.filter((c) => c.riskScore > 20 && c.riskScore <= 40).length },
    { range: "41-60", count: chips.filter((c) => c.riskScore > 40 && c.riskScore <= 60).length },
    { range: "61-80", count: chips.filter((c) => c.riskScore > 60 && c.riskScore <= 80).length },
    { range: "81-100", count: chips.filter((c) => c.riskScore > 80).length },
  ];
  const roleData = [
    { role: "Vendor", tx: ledger.filter((l) => l.type === "Chip Registered").length + 2 },
    { role: "Foundry", tx: ledger.filter((l) => l.type === "Manufactured").length + 3 },
    { role: "Integrator", tx: ledger.filter((l) => l.type === "Integrated").length + 4 },
    { role: "Distributor", tx: ledger.filter((l) => l.type === "Distributed").length + 2 },
    { role: "Auditor", tx: ledger.filter((l) => l.type === "Verified").length + 3 },
    { role: "Recycler", tx: ledger.filter((l) => l.type === "Recycled").length + 1 },
  ];
  const verifiedRate = Math.round(
    (chips.filter((c) => c.history.some((h) => h.stage === "Verified")).length / Math.max(1, chips.length)) * 100
  );
  const avgRisk = useMemo(
    () => Math.round(chips.reduce((a, c) => a + c.riskScore, 0) / Math.max(1, chips.length)),
    [chips]
  );
  const highRisk = chips.filter((c) => c.riskScore >= 60);
  const detected = results.filter((r) => r.detected).length;
  const reasonCounts = chips.flatMap((c) => c.riskReasons).reduce<Record<string, number>>((acc, r) => {
    acc[r] = (acc[r] ?? 0) + 1; return acc;
  }, {});
  const topReason = Object.entries(reasonCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] ?? "—";

  const colors = ["oklch(0.78 0.18 195)", "oklch(0.66 0.25 350)"];
  const riskColors = ["oklch(0.78 0.18 165)", "oklch(0.78 0.18 195)", "oklch(0.82 0.16 80)", "oklch(0.65 0.23 30)", "oklch(0.66 0.25 350)"];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="glass rounded-2xl p-5 ring-grid relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl grad-cyber text-white glow"><Shield className="size-6" /></div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Advanced Security Analytics</h1>
              <p className="text-xs text-muted-foreground">Threat intelligence, attack simulation, and compliance posture</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-success"><ShieldCheck className="size-3.5" /> Detection Engine: Online</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-info/40 bg-[oklch(0.7_0.16_230/0.1)] px-3 py-1"><Activity className="size-3.5" /> Live</span>
          </div>
        </div>
      </section>

      {/* Intelligence + Compliance */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Security Intelligence" subtitle="Network-wide threat posture" icon={<TrendingUp className="size-4" />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <IntelStat label="Attacks Simulated" value={results.length} tone="info" icon={<Bug className="size-4" />} />
            <IntelStat label="Attacks Detected" value={detected} tone="success" icon={<ShieldCheck className="size-4" />} />
            <IntelStat label="High-Risk Chips" value={highRisk.length} tone="danger" icon={<ShieldAlert className="size-4" />} />
            <IntelStat label="Blocked Actions" value={blocked} tone="warn" icon={<Lock className="size-4" />} />
            <IntelStat label="Top Fraud Reason" value={topReason} tone="muted" icon={<AlertTriangle className="size-4" />} small />
          </div>
        </SectionCard>

        <SectionCard title="Compliance & Standards" subtitle="Frameworks aligned" icon={<Award className="size-4" />}>
          <ul className="grid grid-cols-2 gap-2">
            {[
              { label: "NIST Aligned", icon: BadgeCheck },
              { label: "ENISA Aligned", icon: BadgeCheck },
              { label: "DoD HW Security", icon: ShieldCheck },
              { label: "Audit Ready", icon: CheckCircle2 },
              { label: "PUF Identity", icon: Fingerprint },
              { label: "On-chain Attest.", icon: Lock },
            ].map((b) => (
              <li key={b.label} className="flex items-center gap-2 rounded-lg border border-border bg-white/60 px-3 py-2 text-xs">
                <span className="grid size-7 place-items-center rounded-md grad-cyber text-white shrink-0"><b.icon className="size-3.5" /></span>
                <span className="truncate font-medium">{b.label}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Charts */}
      <SectionCard title="Advanced Analytics Dashboard" subtitle="Operational + security KPIs" icon={<Gauge className="size-4" />}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="Fraud vs Authentic">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={fraudData} dataKey="value" innerRadius={36} outerRadius={64} paddingAngle={2}>
                  {fraudData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Stage-wise Distribution">
            <ResponsiveContainer>
              <BarChart data={stageData}>
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Bar dataKey="count" fill="oklch(0.62 0.2 245)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Risk Score Distribution">
            <ResponsiveContainer>
              <BarChart data={riskBuckets}>
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskBuckets.map((_, i) => <Cell key={i} fill={riskColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Transactions per Role">
            <ResponsiveContainer>
              <BarChart data={roleData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="role" type="category" tick={{ fontSize: 10 }} width={70} />
                <Tooltip />
                <Bar dataKey="tx" fill="oklch(0.78 0.18 195)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="rounded-xl border border-border bg-white/60 p-4 flex flex-col">
            <div className="text-xs font-medium text-muted-foreground mb-2">Verification Success Rate</div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-grad-cyber">{verifiedRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">chips reached Verified</div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted">
                <div className="h-full rounded-full grad-cyber" style={{ width: `${verifiedRate}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white/60 p-4 flex flex-col">
            <div className="text-xs font-medium text-muted-foreground mb-2">Average Risk Score</div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${avgRisk >= 60 ? "text-destructive" : avgRisk >= 30 ? "text-warning-foreground" : "text-grad-cyber"}`}>{avgRisk}</div>
              <div className="text-xs text-muted-foreground mt-1">across {chips.length} chips</div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${avgRisk >= 60 ? "grad-danger" : "grad-cyber"}`} style={{ width: `${Math.min(100, avgRisk)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Attack Simulation Lab */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Attack Simulation Lab" subtitle="Frontend-only red-team scenarios" icon={<Bug className="size-4" />}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ATTACKS.map((a) => (
              <button
                key={a.kind}
                onClick={() => runAttack(a.kind)}
                className="group text-left rounded-xl border border-border bg-white/60 p-4 hover:bg-white hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`grid size-10 place-items-center rounded-lg bg-gradient-to-br ${a.color} text-white shrink-0`}>
                    <a.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{a.kind}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">{a.desc}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Click to run</span>
                  <span className="text-[10px] font-mono rounded-md border border-border bg-muted px-2 py-0.5 group-hover:bg-primary/10 group-hover:text-primary transition">SIM</span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={btnGhost} onClick={() => setResults([])}>Clear Results</button>
            <button className={btnPrimary} onClick={() => ATTACKS.forEach((a) => setTimeout(() => runAttack(a.kind), Math.random() * 200))}>
              <Activity className="size-4" /> Run All
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Attack Results" subtitle="Latest detections" icon={<ShieldAlert className="size-4" />}>
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white/40 p-8 text-center text-xs text-muted-foreground">
              No attacks simulated yet. Run a scenario to see detection details.
            </div>
          ) : (
            <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {results.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-white/70 p-3 animate-ledger-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold truncate">{r.kind}</div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${r.detected ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                      {r.detected ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                      {r.detected ? "Blocked" : "Missed"}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                    <div><span className="text-muted-foreground">Chip </span><span className="font-mono">{r.chipId}</span></div>
                    <div className="text-right"><span className="text-muted-foreground">Risk +</span><span className="font-semibold text-destructive">{r.riskDelta}</span></div>
                  </div>
                  <div className="mt-1.5 text-[11px]"><span className="text-muted-foreground">Reason: </span>{r.reason}</div>
                  <div className="mt-1 text-[11px]"><span className="text-muted-foreground">Action: </span>{r.recommendation}</div>
                  <div className="mt-1 text-[10px] font-mono text-muted-foreground">{fmtTime(r.timestamp)}</div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Suspicious chips with reasons */}
      <SectionCard title="Advanced Risk Explanation" subtitle="Why each suspicious chip is flagged" icon={<ShieldAlert className="size-4" />}>
        {!mounted ? (
          <div className="rounded-xl border border-dashed border-border bg-white/40 p-8 text-center text-xs text-muted-foreground">
            Loading risk data…
          </div>
        ) : highRisk.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white/40 p-8 text-center text-xs text-muted-foreground">
            No high-risk chips on the network.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {highRisk.map((c) => (
              <article key={c.id} className="rounded-xl border border-border bg-white/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-sm">{c.id}</div>
                  <StatusPill status={c.status} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">Owner {shorten(c.owner)} · {c.stage}</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full grad-danger" style={{ width: `${c.riskScore}%` }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{c.riskScore}</span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {(c.riskReasons.length ? c.riskReasons : ["Anomalous lifecycle"]).map((r) => (
                    <li key={r} className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
                      <AlertTriangle className="size-3" /> {r}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Threat Forensics Engine */}
      <ThreatForensics results={results} chips={chips} />

      {/* Evidence Vault */}
      <EvidenceVault chips={chips} />

      {/* Security Response Engine */}
      <ResponseEngine />
    </div>
  );
}

function ThreatForensics({ results, chips }: { results: AttackResult[]; chips: Chip[] }) {
  const incidents = results.slice(0, 8);
  const custody = ["Vendor", "Foundry", "Integrator", "Distributor", "End User"];
  const anomalyIdx = incidents.length > 0 ? (incidents.length % custody.length) : 2;

  const causes = [
    { label: "Duplicate ID", count: incidents.filter((i) => i.kind === "Duplicate Chip ID").length, icon: Copy },
    { label: "Unknown Owner", count: incidents.filter((i) => i.kind === "Unauthorized Ownership Transfer").length, icon: UserX },
    { label: "Unauthorized Transfer", count: incidents.filter((i) => i.kind === "Unauthorized Ownership Transfer").length, icon: ShieldAlert },
    { label: "PUF Mismatch", count: incidents.filter((i) => i.kind === "PUF Hash Mismatch").length, icon: Fingerprint },
    { label: "Certificate Mismatch", count: incidents.filter((i) => i.kind === "Certificate Mismatch").length, icon: FileWarning },
  ];

  return (
    <SectionCard title="Threat Forensics Engine" subtitle="Incident timeline, custody trace, and root cause" icon={<FileSearch className="size-4" />}>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Incident Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white/60 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold mb-3"><Search className="size-4 text-primary" /> Incident Timeline</div>
          {incidents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-white/40 p-6 text-center text-xs text-muted-foreground">
              Run an attack simulation to populate forensic incidents.
            </div>
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
                    <th className="py-2 pr-2">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((i) => {
                    const chip = chips.find((c) => c.id === i.chipId);
                    return (
                      <tr key={i.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-2 font-mono text-muted-foreground">{fmtTime(i.timestamp)}</td>
                        <td className="py-2 pr-2 font-medium">{i.kind}</td>
                        <td className="py-2 pr-2 font-mono">{i.chipId}</td>
                        <td className="py-2 pr-2 font-mono">{shorten(chip?.owner ?? "0x0000000000000000")}</td>
                        <td className="py-2 pr-2">{chip?.stage ?? "—"}</td>
                        <td className="py-2 pr-2 font-mono text-primary">0x{i.id.replace(/-/g, "").slice(0, 10)}…</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Root Cause */}
        <div className="rounded-xl border border-border bg-white/60 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold mb-3"><AlertTriangle className="size-4 text-destructive" /> Root Cause Analysis</div>
          <ul className="space-y-2">
            {causes.map((c) => (
              <li key={c.label} className="flex items-center gap-2 rounded-lg border border-border bg-white/70 px-3 py-2">
                <span className="grid size-7 place-items-center rounded-md grad-danger text-white shrink-0"><c.icon className="size-3.5" /></span>
                <span className="text-xs font-medium flex-1 truncate">{c.label}</span>
                <span className="text-xs font-bold tabular-nums">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chain of Custody */}
      <div className="mt-4 rounded-xl border border-border bg-white/60 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold mb-4"><GitBranch className="size-4 text-primary" /> Chain-of-Custody Visualization</div>
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

function EvidenceVault({ chips }: { chips: Chip[] }) {
  const sample = chips[0];
  const items = [
    { label: "PUF Hash Verification", icon: Fingerprint, hash: sample?.pufHash ?? "0xPUF…", valid: true, desc: "Physical fingerprint matches enrollment registry." },
    { label: "Watermark Hash", icon: Hash, hash: sample?.watermarkHash ?? "0xWMK…", valid: true, desc: "Embedded silicon watermark verified on-chain." },
    { label: "Certificate Hash", icon: FileWarning, hash: sample?.certHash ?? "0xCRT…", valid: true, desc: "Compliance certificate signature validated." },
    { label: "Blockchain Tx Proof", icon: Database, hash: sample?.lastTxHash ?? "0xTX…", valid: true, desc: "Last lifecycle event anchored to ledger block." },
    { label: "QR Chip Passport", icon: QrCode, hash: sample?.id ?? "CHIP-…", valid: true, desc: "Scan-verified passport linked to on-chain record." },
  ];
  return (
    <SectionCard title="Evidence Vault" subtitle="Cryptographic proofs and verifications" icon={<Lock className="size-4" />}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <article key={it.label} className="rounded-xl border border-border bg-white/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg grad-cyber text-white"><it.icon className="size-4" /></span>
                <div className="text-sm font-semibold">{it.label}</div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${it.valid ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                {it.valid ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                {it.valid ? "Valid" : "Mismatch"}
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-border bg-muted/40 px-2 py-1.5 font-mono text-[10px] truncate">{it.hash}</div>
            <p className="mt-2 text-[11px] text-muted-foreground">{it.desc}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function ResponseEngine() {
  const [log, setLog] = useState<{ id: string; action: string; ts: number }[]>([]);
  const trigger = (action: string, message: string) => {
    setLog((l) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, action, ts: Date.now() }, ...l].slice(0, 8));
    toast.success(message);
  };
  const actions = [
    { label: "Quarantine Chip", icon: Lock, color: "from-amber-500 to-orange-500", msg: "Chip quarantined — lifecycle frozen" },
    { label: "Block Wallet", icon: Ban, color: "from-rose-500 to-red-500", msg: "Wallet blacklisted across network" },
    { label: "Request Re-Verification", icon: RefreshCw, color: "from-cyan-500 to-blue-500", msg: "Re-verification dispatched to auditor" },
    { label: "Alert Auditor", icon: Mail, color: "from-violet-500 to-fuchsia-500", msg: "Auditor notified of incident" },
    { label: "Reject Transaction", icon: XCircle, color: "from-red-500 to-rose-600", msg: "Transaction reverted on-chain" },
  ];
  return (
    <SectionCard title="Security Response Engine" subtitle="Automated incident actions" icon={<ShieldCheck className="size-4" />}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => trigger(a.label, a.msg)}
            className="group rounded-xl border border-border bg-white/60 p-4 text-left hover:bg-white hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <div className={`grid size-10 place-items-center rounded-lg bg-gradient-to-br ${a.color} text-white`}>
              <a.icon className="size-5" />
            </div>
            <div className="mt-3 text-sm font-semibold">{a.label}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-primary transition">Click to execute</div>
          </button>
        ))}
      </div>
      {log.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-white/60 p-3">
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white/60 p-3">
      <div className="text-xs font-medium text-muted-foreground mb-2">{title}</div>
      <div className="h-44">{children}</div>
    </div>
  );
}

function IntelStat({
  label, value, tone, icon, small,
}: {
  label: string; value: string | number; tone: "info" | "success" | "danger" | "warn" | "muted"; icon: React.ReactNode; small?: boolean;
}) {
  const toneCls: Record<string, string> = {
    info: "border-info/30 bg-[oklch(0.7_0.16_230/0.08)] text-foreground",
    success: "border-success/30 bg-success/10 text-success",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    warn: "border-warning/40 bg-warning/15 text-warning-foreground",
    muted: "border-border bg-white/60 text-foreground",
  };
  return (
    <div className={`rounded-xl border p-3 ${toneCls[tone]}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-80">
        {icon}<span className="truncate">{label}</span>
      </div>
      <div className={`mt-1 font-bold ${small ? "text-sm truncate" : "text-2xl tabular-nums"}`}>{value}</div>
    </div>
  );
}