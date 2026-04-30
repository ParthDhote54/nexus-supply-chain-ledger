import type { VerificationStatus } from "@/lib/nexus-store";

const map: Record<VerificationStatus, string> = {
  Authentic: "border-success/40 bg-success/10 text-success",
  Fake: "border-destructive/40 bg-destructive/10 text-destructive",
  Cloned: "border-cyber-magenta/40 bg-[oklch(0.66_0.25_350/0.12)] text-[oklch(0.5_0.2_350)]",
  Tampered: "border-warning/50 bg-warning/15 text-warning-foreground",
  Unknown: "border-border bg-muted text-muted-foreground",
};

export function StatusPill({ status }: { status: VerificationStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
