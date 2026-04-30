import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS Semiconductor Ledger" },
      {
        name: "description",
        content: "Blockchain-based semiconductor supply chain tracking with chip passports, fraud detection, and lifecycle verification.",
      },
      { property: "og:title", content: "NEXUS Semiconductor Ledger" },
      {
        property: "og:description",
        content: "Track every semiconductor chip from foundry to recycler with tamper-proof on-chain passports.",
      },
    ],
  }),
  component: () => <Navigate to="/dashboard/$role" params={{ role: "vendor" }} />,
});
