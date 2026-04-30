import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "h-10 rounded-lg border border-border bg-white/70 px-3 text-sm font-mono outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg grad-cyber px-4 text-sm font-semibold text-white glow hover:opacity-95 active:scale-[0.99] transition";

export const btnGhost =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white/70 px-4 text-sm font-medium hover:bg-white transition";
