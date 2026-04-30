import { TransferForm } from "../TransferForm";
import { StageOps } from "../StageOps";
import { SearchAndVerify } from "../SearchAndVerify";
import { LedgerFeed } from "../LedgerFeed";
import { RiskCard } from "../RiskCard";
import { FraudPanel } from "../FraudPanel";

export function IntegratorDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <TransferForm />
        <StageOps allowed={["Ownership Acquired", "Integrated"]} />
        <SearchAndVerify />
      </div>
      <div className="space-y-6">
        <RiskCard />
        <FraudPanel />
        <LedgerFeed limit={8} />
      </div>
    </div>
  );
}
