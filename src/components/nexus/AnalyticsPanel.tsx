import { useNexus, STAGE_FLOW } from "@/lib/nexus-store";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { SectionCard } from "./SectionCard";
import { BarChart3 } from "lucide-react";

export function AnalyticsPanel() {
  const { chips, ledger } = useNexus();
  const stageData = STAGE_FLOW.map((s) => ({ stage: s.split(" ")[0], count: chips.filter((c) => c.stage === s).length }));
  const fraudData = [
    { name: "Genuine", value: chips.filter((c) => c.status === "Authentic").length },
    { name: "Suspicious", value: chips.filter((c) => c.status !== "Authentic").length },
  ];
  const roleData = [
    { role: "Vendor", tx: ledger.filter((l) => l.type === "Chip Registered").length },
    { role: "Foundry", tx: ledger.filter((l) => l.type === "Manufactured").length + 2 },
    { role: "Integrator", tx: ledger.filter((l) => l.type === "Integrated").length + 3 },
    { role: "Distributor", tx: ledger.filter((l) => l.type === "Distributed").length + 1 },
    { role: "Auditor", tx: ledger.filter((l) => l.type === "Verified").length + 2 },
    { role: "Recycler", tx: ledger.filter((l) => l.type === "Recycled").length },
  ];
  const verifiedRate = Math.round(
    (chips.filter((c) => c.history.some((h) => h.stage === "Verified")).length / Math.max(1, chips.length)) * 100
  );
  const colors = ["oklch(0.62 0.2 245)", "oklch(0.66 0.25 350)"];

  return (
    <SectionCard title="Analytics Dashboard" subtitle="Operational intelligence" icon={<BarChart3 className="size-4" />}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-white/60 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Chips by Stage</div>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={stageData}>
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} stroke="currentColor" />
                <YAxis tick={{ fontSize: 10 }} stroke="currentColor" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Bar dataKey="count" fill="oklch(0.62 0.2 245)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white/60 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Genuine vs Suspicious</div>
          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={fraudData} dataKey="value" innerRadius={36} outerRadius={64} paddingAngle={2}>
                  {fraudData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white/60 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Transactions per Role</div>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={roleData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="role" type="category" tick={{ fontSize: 10 }} width={70} />
                <Tooltip />
                <Bar dataKey="tx" fill="oklch(0.78 0.18 195)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white/60 p-3 flex flex-col">
          <div className="text-xs font-medium text-muted-foreground mb-2">Verification Success Rate</div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-grad-cyber">{verifiedRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">of chips reached Verified stage</div>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div className="h-full rounded-full grad-cyber" style={{ width: `${verifiedRate}%` }} />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
