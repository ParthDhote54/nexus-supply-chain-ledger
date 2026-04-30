import { useNexus } from "@/lib/nexus-store";
import { ShieldAlert } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { RiskMeter } from "./RiskMeter";

export function RiskCard({ chipId }: { chipId?: string }) {
  const chips = useNexus((s) => s.chips);
  const chip = chips.find((c) => c.id === chipId) ?? chips[0];
  if (!chip) return null;
  return (
    <SectionCard title="Risk Scoring" subtitle={`Live risk profile for ${chip.id}`} icon={<ShieldAlert className="size-4" />}>
      <RiskMeter score={chip.riskScore} reasons={chip.riskReasons} />
    </SectionCard>
  );
}
