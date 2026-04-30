import { Link, useRouterState } from "@tanstack/react-router";
import { ROLES } from "@/lib/nexus-store";
import {
  Factory, Boxes, Cpu, Truck, User, Recycle, ShieldCheck,
} from "lucide-react";

const ICONS = {
  vendor: Factory,
  integrator: Boxes,
  foundry: Cpu,
  distributor: Truck,
  enduser: User,
  recycler: Recycle,
  auditor: ShieldCheck,
} as const;

export function RoleTabs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-4">
      <div className="glass rounded-2xl p-2 flex gap-1 overflow-x-auto">
        {ROLES.map((r) => {
          const active = path === `/dashboard/${r.id}`;
          const Icon = ICONS[r.id];
          return (
            <Link
              key={r.id}
              to="/dashboard/$role"
              params={{ role: r.id }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "grad-cyber text-white glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60"
              }`}
            >
              <Icon className="size-4" />
              <span className="whitespace-nowrap">{r.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
