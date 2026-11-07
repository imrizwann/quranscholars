import { moneyText } from "./revenue-utils.js";

export default function RevenueCalculation({ totals, currency, exponent, mode, admin }) {
  const ready = Number.isSafeInteger(totals.reviewedSales);
  const reviewed = ready && totals.reviewedSales > 0;
  const format = value => reviewed ? moneyText(value, currency, exponent) : "Awaiting reviewed sales";
  return <section className="revenue-calculation" aria-label="Earnings calculation">
    <div><h3>{mode === "test" ? "Test earnings calculation" : "Earnings calculation"}</h3><p className="revenue-note">Reviewed sales minus refunds, sales tax, and gateway fees. The remaining amount is shared equally between instructor and platform.</p></div>
    <p className="revenue-formula">Net sales <span aria-hidden="true">×</span> 50% <span aria-hidden="true">=</span> {admin ? "Instructor earnings" : "Your earnings"}</p>
    {reviewed ? <>
      <p className="revenue-note">Based on {totals.reviewedSales} reviewed {totals.reviewedSales === 1 ? "sale" : "sales"}{totals.reviewPending > 0 ? `; ${totals.reviewPending} awaiting review are excluded` : ""}. {mode === "test" && "Simulated earnings only; these funds cannot be paid out."}</p>
      <dl className="revenue-calculation-lines">
        <div><dt>Reviewed gross sales</dt><dd>{format(totals.reviewedGrossMinor)}</dd></div>
        <div><dt>Less refunds</dt><dd>− {format(totals.reviewedRefundedMinor)}</dd></div>
        <div><dt>Less sales tax</dt><dd>− {format(totals.salesTaxMinor)}</dd></div>
        <div><dt>Less gateway fees</dt><dd>− {format(totals.reviewedGatewayFeeMinor)}</dd></div>
        <div className="revenue-calculation-subtotal"><dt>Net after deductions</dt><dd>{format(totals.netMinor)}</dd></div>
        {totals.processorLossMinor > 0 && <><div><dt>Processing losses covered by platform</dt><dd>+ {format(totals.processorLossMinor)}</dd></div><div><dt>Eligible for revenue sharing</dt><dd>{format(totals.shareableMinor)}</dd></div></>}
        <div className="revenue-calculation-result"><dt>{admin ? "Instructor earnings" : "Your earnings"}</dt><dd>{format(totals.earnedMinor)}</dd></div>
        {admin && <div><dt>Platform share after any processing losses</dt><dd>{format(totals.platformMinor)}</dd></div>}
      </dl>
      <p className="revenue-note">Calculated per sale using the split saved at checkout, rounded to the currency’s smallest unit. {mode !== "test" && "Earnings become payable after financial review and the 30-day hold."}</p>
    </> : <p className="revenue-note">{ready ? totals.reviewPending > 0 ? "These sales are awaiting financial review. Their earnings will appear once the tax treatment, gateway fees, and settlement are confirmed." : `No reviewed ${mode === "test" ? "test" : mode === "live" ? "live" : ""} sales match these filters yet.` : "Detailed calculations will appear once the revenue service has been updated."}</p>}
  </section>;
}
