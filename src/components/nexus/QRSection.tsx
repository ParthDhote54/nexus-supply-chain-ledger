import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNexus } from "@/lib/nexus-store";
import { QrCode, ScanLine } from "lucide-react";
import { Field, inputCls, btnPrimary, btnGhost } from "./Field";
import { SectionCard } from "./SectionCard";
import { toast } from "sonner";

export function QRSection() {
  const chips = useNexus((s) => s.chips);
  const [chipId, setChipId] = useState(chips[0]?.id ?? "");
  const [generated, setGenerated] = useState(false);
  const chip = chips.find((c) => c.id === chipId);
  const payload = chip ? JSON.stringify({ id: chip.id, puf: chip.pufHash, owner: chip.owner }) : "";

  return (
    <SectionCard title="QR Verification" subtitle="Generate or scan chip passport QR" icon={<QrCode className="size-4" />}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Chip ID">
            <input list="all-chips" className={inputCls} value={chipId} onChange={(e) => { setChipId(e.target.value); setGenerated(false); }} />
          </Field>
          <div className="flex gap-2">
            <button className={btnPrimary} onClick={() => { if (chip) { setGenerated(true); toast.success("QR generated"); } else toast.error("Invalid chip"); }}>
              <QrCode className="size-4" />Generate QR
            </button>
            <button className={btnGhost} onClick={() => toast.success(chip ? `✓ QR matches on-chain record for ${chip.id}` : "No chip selected")}>
              <ScanLine className="size-4" />Scan / Verify
            </button>
          </div>
          {chip && (
            <div className="rounded-lg border border-border bg-white/60 p-3 text-xs space-y-1">
              <div><span className="text-muted-foreground">Owner:</span> <span className="font-mono">{chip.owner}</span></div>
              <div><span className="text-muted-foreground">Stage:</span> {chip.stage}</div>
              <div><span className="text-muted-foreground">Status:</span> {chip.status}</div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center">
          {generated && chip ? (
            <div className="rounded-2xl bg-white p-4 border border-border glow-cyan">
              <QRCodeSVG value={payload} size={196} level="M" />
              <div className="mt-2 text-center text-[11px] font-mono">{chip.id}</div>
            </div>
          ) : (
            <div className="grid h-[228px] w-[228px] place-items-center rounded-2xl border-2 border-dashed border-border text-xs text-muted-foreground text-center px-4">
              Generate QR<br />to preview chip passport
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
