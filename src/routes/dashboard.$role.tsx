import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNexus, type Role, ROLES } from "@/lib/nexus-store";
import { VendorDashboard } from "@/components/nexus/dashboards/VendorDashboard";
import { IntegratorDashboard } from "@/components/nexus/dashboards/IntegratorDashboard";
import { FoundryDashboard } from "@/components/nexus/dashboards/FoundryDashboard";
import { DistributorDashboard } from "@/components/nexus/dashboards/DistributorDashboard";
import { EndUserDashboard } from "@/components/nexus/dashboards/EndUserDashboard";
import { RecyclerDashboard } from "@/components/nexus/dashboards/RecyclerDashboard";
import { AuditorDashboard } from "@/components/nexus/dashboards/AuditorDashboard";

export const Route = createFileRoute("/dashboard/$role")({
  component: RoleRouter,
});

function RoleRouter() {
  const { role } = Route.useParams();
  const setRole = useNexus((s) => s.setRole);
  const valid = ROLES.some((r) => r.id === role);

  useEffect(() => {
    if (valid) setRole(role as Role);
  }, [role, setRole, valid]);

  if (!valid) return <Navigate to="/dashboard/$role" params={{ role: "vendor" }} />;

  switch (role as Role) {
    case "vendor": return <VendorDashboard />;
    case "integrator": return <IntegratorDashboard />;
    case "foundry": return <FoundryDashboard />;
    case "distributor": return <DistributorDashboard />;
    case "enduser": return <EndUserDashboard />;
    case "recycler": return <RecyclerDashboard />;
    case "auditor": return <AuditorDashboard />;
  }
}
