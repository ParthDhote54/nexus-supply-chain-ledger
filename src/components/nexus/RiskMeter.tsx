export function RiskMeter({ score, reasons }: { score: number; reasons: string[] }) {
  const level = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  const grad = score >= 70 ? "grad-danger" : score >= 40 ? "bg-warning" : "grad-success";
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Risk Score</div>
          <div className="text-3xl font-bold tabular-nums">{score}<span className="text-base text-muted-foreground">/100</span></div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${grad}`}>{level} Risk</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${grad} transition-all duration-700`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Duplicate chip", "Missing stage", "Unknown owner", "Failed verification", "Unauthorized update"].map((r) => {
          const on = reasons.includes(r);
          return (
            <span
              key={r}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                on ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border text-muted-foreground"
              }`}
            >
              {on ? "● " : "○ "}{r}
            </span>
          );
        })}
      </div>
    </div>
  );
}
