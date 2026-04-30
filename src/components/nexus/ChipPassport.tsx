import { QRCodeSVG } from "qrcode.react";
import type { Chip } from "@/lib/nexus-store";
import { shorten, fmtTime } from "@/lib/nexus-store";
import { StatusPill } from "./StatusPill";
import { LifecycleTimeline } from "./LifecycleTimeline";

export function ChipPassport({ chip }: { chip: Chip }) {
  const payload = JSON.stringify({ id: chip.id, puf: chip.pufHash, owner: chip.owner });
  return (
    <div className="rounded-2xl border border-border bg-white/80 p-5 ring-grid">
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Digital Chip Passport</div>
              <div className="text-2xl font-bold font-mono">{chip.id}</div>
            </div>
            <StatusPill status={chip.status} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PassportField label="PUF Hash" value={chip.pufHash} mono />
            <PassportField label="Watermark Hash" value={chip.watermarkHash} mono />
            <PassportField label="Certificate Hash" value={chip.certHash} mono />
            <PassportField label="Owner" value={shorten(chip.owner)} mono />
            <PassportField label="Origin" value={chip.origin} />
            <PassportField label="Current Stage" value={chip.stage} />
            <PassportField label="Verification" value={chip.status} />
            <PassportField label="Risk Score" value={`${chip.riskScore}/100`} />
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Lifecycle</div>
            <LifecycleTimeline current={chip.stage} />
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Lifecycle History</div>
            <ol className="space-y-1.5 text-xs">
              {chip.history.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white/60 px-3 py-1.5">
                  <span className="font-medium">{h.stage}</span>
                  <span className="text-muted-foreground font-mono">{shorten(h.actor)}</span>
                  <span className="text-muted-foreground font-mono">{fmtTime(h.timestamp)}</span>
                  <a className="text-primary font-mono hover:underline" href={`https://sepolia.etherscan.io/tx/${h.txHash}`} target="_blank" rel="noreferrer">{shorten(h.txHash, 6, 4)}</a>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 lg:w-56 shrink-0">
          <div className="rounded-xl bg-white p-3 border border-border glow-cyan">
            <QRCodeSVG value={payload} size={176} level="M" />
          </div>
          <div className="text-[11px] text-muted-foreground text-center">
            Scan to verify on-chain<br />
            <span className="font-mono">{shorten(chip.lastTxHash, 8, 6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassportField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-white/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm truncate ${mono ? "font-mono" : ""}`} title={value}>{value}</div>
    </div>
  );
}
