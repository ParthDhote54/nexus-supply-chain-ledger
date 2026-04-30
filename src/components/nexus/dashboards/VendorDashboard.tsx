import { useState } from "react";
import { useNexus } from "@/lib/nexus-store";
import { Field, inputCls, btnPrimary } from "../Field";
import { SectionCard } from "../SectionCard";
import { LedgerFeed } from "../LedgerFeed";
import { FraudPanel } from "../FraudPanel";
import { ExplorerPanel } from "../ExplorerPanel";
import { Cpu, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export function VendorDashboard() {
  const { chips, addChip, pushAlert } = useNexus();
  const [form, setForm] = useState({
    id: "", batch: "", vendor: "", pufHash: "", watermarkHash: "", certHash: "",
    manufactureDate: "", owner: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chips.some((c) => c.id === form.id)) {
      pushAlert({ kind: "Duplicate chip detected", chipId: form.id, detail: "Chip ID already exists in ledger" });
      return toast.error("Duplicate chip ID — registration blocked");
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(form.owner)) return toast.error("Invalid initial owner wallet");
    // addChip is async and broadcasts a real Sepolia tx; it shows its own success/error toast.
    await addChip(form);
    setForm({ id: "", batch: "", vendor: "", pufHash: "", watermarkHash: "", certHash: "", manufactureDate: "", owner: "" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <SectionCard title="Register New Chip" subtitle="Vendor: create digital identity" icon={<Cpu className="size-4" />}>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Chip ID"><input className={inputCls} required value={form.id} onChange={(e)=>set("id", e.target.value)} placeholder="NXS-XX-00000" /></Field>
            <Field label="Batch Number"><input className={inputCls} required value={form.batch} onChange={(e)=>set("batch", e.target.value)} placeholder="BATCH-2026-…" /></Field>
            <Field label="Vendor / Manufacturer"><input className={inputCls} required value={form.vendor} onChange={(e)=>set("vendor", e.target.value)} placeholder="TSMC Foundry Co." /></Field>
            <Field label="Manufacture Date"><input type="date" className={inputCls} required value={form.manufactureDate} onChange={(e)=>set("manufactureDate", e.target.value)} /></Field>
            <Field label="PUF Hash"><input className={inputCls} required value={form.pufHash} onChange={(e)=>set("pufHash", e.target.value)} placeholder="0x…" /></Field>
            <Field label="Watermark Hash"><input className={inputCls} required value={form.watermarkHash} onChange={(e)=>set("watermarkHash", e.target.value)} placeholder="0x…" /></Field>
            <Field label="Certificate / Compliance Hash"><input className={inputCls} required value={form.certHash} onChange={(e)=>set("certHash", e.target.value)} placeholder="0x…" /></Field>
            <Field label="Initial Owner Wallet"><input className={inputCls} required value={form.owner} onChange={(e)=>set("owner", e.target.value)} placeholder="0x…40 chars" /></Field>
            <div className="sm:col-span-2 flex justify-end">
              <button className={btnPrimary}><PlusCircle className="size-4" />Register Chip</button>
            </div>
          </form>
        </SectionCard>
        <ExplorerPanel />
      </div>
      <div className="space-y-6">
        <FraudPanel />
        <LedgerFeed limit={8} />
      </div>
    </div>
  );
}
