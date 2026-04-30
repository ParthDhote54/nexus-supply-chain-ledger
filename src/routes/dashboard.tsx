import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/nexus/Navbar";
import { RoleTabs } from "@/components/nexus/RoleTabs";
import { StatCards } from "@/components/nexus/StatCards";
import { AdvancedOperationsCenter } from "@/components/nexus/AdvancedOperationsCenter";
import { Toaster } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <RoleTabs />
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 space-y-6">
        <StatCards />
        <Outlet />
        <AdvancedOperationsCenter />
      </main>
      <footer className="mx-auto max-w-[1400px] px-6 py-8 text-center text-xs text-muted-foreground">
        NEXUS Semiconductor Ledger · Powered by Ethereum · UI demo with simulated on-chain data
      </footer>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
