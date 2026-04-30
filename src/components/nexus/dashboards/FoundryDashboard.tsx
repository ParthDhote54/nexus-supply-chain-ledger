import { StageOps } from "../StageOps";
import { TransferForm } from "../TransferForm";
import { LedgerFeed } from "../LedgerFeed";
import { ExplorerPanel } from "../ExplorerPanel";
import { FraudPanel } from "../FraudPanel";
import { AnalyticsPanel } from "../AnalyticsPanel";

export function FoundryDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <StageOps allowed={["Manufactured", "Distributed"]} />
        <TransferForm />
        <AnalyticsPanel />
      </div>
      <div className="space-y-6">
        <ExplorerPanel />
        <FraudPanel />
        <LedgerFeed limit={8} />
      </div>
    </div>
  );
}
