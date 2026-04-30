import { useNexus } from "@/lib/nexus-store";
import {
  Cpu, ShieldCheck, AlertTriangle, ArrowLeftRight, Activity, Users,
} from "lucide-react";

export function StatCards() {
  const { chips, ledger } = useNexus();
  const verified = chips.filter((c) => c.status === "Authentic" && c.stage === "Verified").length;
  const suspicious = chips.filter((c) => c.riskScore >= 60 || c.status !== "Authentic").length;
  const pending = chips.filter((c) => c.history.some((h) => h.stage === "Ownership Released") && !c.history.some((h) => h.stage === "Ownership Acquired" && h.timestamp > (c.history.find(x=>x.stage==="Ownership Released")!.timestamp))).length;

  const stats = [
    { label: "Total Chips", value: chips.length, icon: Cpu, grad: "grad-cyber" },
    { label: "Verified Chips", value: verified, icon: ShieldCheck, grad: "grad-success" },
    { label: "Suspicious", value: suspicious, icon: AlertTriangle, grad: "grad-danger" },
    { label: "Pending Transfers", value: pending, icon: ArrowLeftRight, grad: "grad-primary" },
    { label: "Total Transactions", value: ledger.length, icon: Activity, grad: "grad-cyber" },
    { label: "Active Stakeholders", value: 7, icon: Users, grad: "grad-primary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label} className="card-premium rounded-2xl p-5 relative overflow-hidden group">
          <div className={`absolute -right-6 -top-6 size-24 rounded-full opacity-25 blur-2xl ${s.grad} transition-opacity group-hover:opacity-40`} />
          <div className={`grid size-12 place-items-center rounded-xl text-white shadow-lg ${s.grad}`}>
            <s.icon className="size-[22px]" strokeWidth={2.2} />
          </div>
          <div className="mt-4 text-3xl font-extrabold tabular-nums tracking-tight text-display">{s.value}</div>
          <div className="text-[0.78rem] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
