import { moneyText } from "./revenue-utils.js";

export default function RevenueCalculation({ totals, currency, exponent, mode, admin }) {
  const ready = Number.isSafeInteger(totals.reviewedSales);
  const reviewed = ready && totals.reviewedSales > 0;
  const format = value => reviewed ? moneyText(value, currency, exponent) : "Awaiting verified sales";
  return <section className="revenue-calculation" aria-label="Earnings calculation">
    <div><h3>{mode === "test" ? "Test earnings calculation" : "Earnings calculation"}</h3><p className="revenue-note">All confirmed sales, less refunds, included 18% GST, and verified gateway fees. The remaining amount is shared equally between instructor and platform.</p></div>
    <p className="revenue-formula">Net sales <span aria-hidden="true">×</span> 50% <span aria-hidden="true">=</span> {admin ? "Instructor earnings" : "Your earnings"}</p>
    {reviewed ? <>
      <p className="revenue-note">Based on {totals.reviewedSales} verified {totals.reviewedSales === 1 ? "sale" : "sales"}{totals.reviewPending > 0 ? `; ${totals.reviewPending} with payment exceptions are excluded` : ""}. {mode === "test" && "Simulated earnings only; these funds cannot be paid out."}</p>
      <dl className="revenue-calculation-lines">
        <div><dt>Verified gross sales</dt><dd>{format(totals.reviewedGrossMinor)}</dd></div>
        <div><dt>Less refunds</dt><dd>− {format(totals.reviewedRefundedMinor)}</dd></div>
        <div><dt>Less GST / sales tax</dt><dd>− {format(totals.salesTaxMinor)}</dd></div>
        <div><dt>Less gateway fees</dt><dd>− {format(totals.reviewedGatewayFeeMinor)}</dd></div>
        <div className="revenue-calculation-subtotal"><dt>Net after deductions</dt><dd>{format(totals.netMinor)}</dd></div>
        {totals.processorLossMinor > 0 && <><div><dt>Processing losses covered by platform</dt><dd>+ {format(totals.processorLossMinor)}</dd></div><div><dt>Eligible for revenue sharing</dt><dd>{format(totals.shareableMinor)}</dd></div></>}
        <div className="revenue-calculation-result"><dt>{admin ? "Instructor earnings" : "Your earnings"}</dt><dd>{format(totals.earnedMinor)}</dd></div>
        {admin && <div><dt>Platform share after any processing losses</dt><dd>{format(totals.platformMinor)}</dd></div>}
      </dl>
      <p className="revenue-note">Calculated per sale using the split saved at checkout, rounded to the currency’s smallest unit. {mode !== "test" && "Earnings become available after the 30-day hold. Received funds are confirmed before each monthly transfer."}</p>
    </> : <p className="revenue-note">{ready ? totals.reviewPending > 0 ? "Payment data is incomplete or disputed. Confirmed sales are calculated automatically; no sales approval is required." : `No verified ${mode === "test" ? "test" : mode === "live" ? "live" : ""} sales match these filters yet.` : "Detailed calculations will appear once the revenue service has been updated."}</p>}
  </section>;
}
