import { STAGE_FLOW, type Stage } from "@/lib/nexus-store";
import { Check } from "lucide-react";

export function LifecycleTimeline({ current }: { current: Stage }) {
  const idx = STAGE_FLOW.indexOf(current);
  return (
    <ol className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {STAGE_FLOW.map((s, i) => {
        const reached = i <= idx;
        const isCurrent = i === idx;
        return (
          <li key={s} className="relative">
            <div className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-xs ${
              isCurrent
                ? "border-primary/50 bg-primary/5 glow"
                : reached
                ? "border-success/40 bg-success/10"
                : "border-border bg-card/60 text-muted-foreground"
            }`}>
              <div className={`grid size-6 shrink-0 place-items-center rounded-full ${
                reached ? "grad-cyber text-white" : "bg-muted text-muted-foreground"
              }`}>
                {reached ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className="font-medium truncate">{s}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
