import { useState } from "react";
import { useNexus, type Stage } from "@/lib/nexus-store";
import { Field, inputCls, btnPrimary } from "./Field";
import { SectionCard } from "./SectionCard";
import { Workflow } from "lucide-react";
import { LifecycleTimeline } from "./LifecycleTimeline";
import { toast } from "sonner";

export function StageOps({ allowed }: { allowed: Stage[] }) {
  const { chips, advanceStage } = useNexus();
  const [chipId, setChipId] = useState(chips[0]?.id ?? "");
  const chip = chips.find((c) => c.id === chipId);
  const onAdvance = async (s: Stage) => {
    if (!chip) return toast.error("Select a valid chip");
    // advanceStage broadcasts a real Sepolia tx and emits its own toasts.
    await advanceStage(chip.id, s);
  };
  return (
    <SectionCard title="Lifecycle Tracking" subtitle="Advance chip stage on-chain" icon={<Workflow className="size-4" />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Target Chip ID">
          <input list="all-chips" className={inputCls} value={chipId} onChange={(e) => setChipId(e.target.value)} />
          <datalist id="all-chips">
            {chips.map((c) => <option key={c.id} value={c.id} />)}
          </datalist>
        </Field>
        <Field label="Current Stage">
          <div className={`${inputCls} flex items-center`}>{chip?.stage ?? "—"}</div>
        </Field>
      </div>
      <div className="mt-4">
        <LifecycleTimeline current={chip?.stage ?? "Registered"} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {allowed.map((s) => (
          <button key={s} className={btnPrimary} onClick={() => onAdvance(s)}>Mark {s}</button>
        ))}
      </div>
    </SectionCard>
  );
}
