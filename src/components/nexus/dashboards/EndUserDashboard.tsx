import { SearchAndVerify } from "../SearchAndVerify";
import { QRSection } from "../QRSection";
import { RiskCard } from "../RiskCard";
import { LedgerFeed } from "../LedgerFeed";
import { FraudPanel } from "../FraudPanel";

export function EndUserDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <SearchAndVerify />
        <QRSection />
      </div>
      <div className="space-y-6">
        <RiskCard />
        <FraudPanel />
        <LedgerFeed limit={8} />
      </div>
    </div>
  );
}
