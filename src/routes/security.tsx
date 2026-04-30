import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/nexus/Navbar";
import { RoleTabs } from "@/components/nexus/RoleTabs";
import { AdvancedSecurity } from "@/components/nexus/AdvancedSecurity";
import { Toaster } from "sonner";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Advanced Security Analytics — NEXUS Semiconductor Ledger" },
      { name: "description", content: "Threat intelligence, attack simulation lab, and compliance posture for the NEXUS chip supply chain." },
      { property: "og:title", content: "Advanced Security Analytics — NEXUS" },
      { property: "og:description", content: "Run attack simulations and inspect risk analytics across the chip ledger." },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <RoleTabs />
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 space-y-6">
        <AdvancedSecurity />
      </main>
      <footer className="mx-auto max-w-[1400px] px-6 py-8 text-center text-xs text-muted-foreground">
        NEXUS Semiconductor Ledger · Advanced Security Analytics
      </footer>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}