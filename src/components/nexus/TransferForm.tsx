import { useState } from "react";
import { useNexus } from "@/lib/nexus-store";
import { ROLES } from "@/lib/nexus-store";
import { ArrowLeftRight } from "lucide-react";
import { Field, inputCls, btnPrimary } from "./Field";
import { SectionCard } from "./SectionCard";
import { toast } from "sonner";

export function TransferForm() {
  const { chips, transferOwnership, pushAlert } = useNexus();
  const [chipId, setChipId] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [role, setRole] = useState("integrator");
  const [reason, setReason] = useState("");

  const chip = chips.find((c) => c.id === chipId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chip) return toast.error("Chip ID not found");
    if (!/^0x[0-9a-fA-F]{40}$/.test(newOwner)) {
      pushAlert({ kind: "Unauthorized ownership transfer", chipId: chipId, detail: "Invalid wallet address rejected" });
      return toast.error("Invalid receiver wallet");
    }
    // transferOwnership broadcasts a real Sepolia tx and emits its own toasts.
    await transferOwnership(chip.id, newOwner, role, reason || "transfer");
    setNewOwner(""); setReason("");
  };

  return (
    <SectionCard title="Ownership Transfer" subtitle="Move chip custody to next stakeholder" icon={<ArrowLeftRight className="size-4" />}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Chip ID">
          <input list="all-chips" className={inputCls} value={chipId} onChange={(e) => setChipId(e.target.value)} placeholder="NXS-…" required />
        </Field>
        <Field label="Current Owner">
          <input className={inputCls} value={chip?.owner ?? ""} readOnly placeholder="auto-detected" />
        </Field>
        <Field label="New Owner Wallet">
          <input className={inputCls} value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder="0x…" required />
        </Field>
        <Field label="Receiver Role">
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Transfer Reason">
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Shipped to integrator" />
          </Field>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button className={btnPrimary}><ArrowLeftRight className="size-4" />Transfer Ownership</button>
        </div>
      </form>
    </SectionCard>
  );
}
