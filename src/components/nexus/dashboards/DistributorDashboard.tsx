import { StageOps } from "../StageOps";
import { TransferForm } from "../TransferForm";
import { SearchAndVerify } from "../SearchAndVerify";
import { LedgerFeed } from "../LedgerFeed";
import { FraudPanel } from "../FraudPanel";

export function DistributorDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <StageOps allowed={["Distributed"]} />
        <TransferForm />
        <SearchAndVerify />
      </div>
      <div className="space-y-6">
        <FraudPanel />
        <LedgerFeed limit={8} />
      </div>
    </div>
  );
}
