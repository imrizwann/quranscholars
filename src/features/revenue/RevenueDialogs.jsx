import { useRef, useState } from "react";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import revenueApi from "@/services/api/revenueApi.js";
import { userMessage } from "@/lib/user-messages.js";
import { currentPeriod, dateText, localDateTime, moneyInput, moneyText, parseMoney, suggestedSalesPeriod } from "./revenue-utils.js";

function Field({ name, label, ...props }) { return <label className="revenue-field">{label}<input name={name} {...props} /></label>; }
function Note() { return <label className="revenue-field">Review note<textarea name="note" required minLength={10} maxLength={500} rows={3} placeholder="Record the basis for this decision." /></label>; }
function Confirm({ children }) { return <label className="revenue-confirm"><input type="checkbox" name="confirm" required /> <span>{children}</span></label>; }
function SaleDialog({ id, admin, onClose }) {
  const query = revenueApi.endpoints.getRevenue.useQuery({ admin, view: "sales", id }, { refetchOnMountOrArgChange: true });
  const [refresh, refreshing] = revenueApi.endpoints.revenueAction.useMutation();
  const [error, setError] = useState("");
  const sale = query.currentData?.sale;
  async function verify() {
    setError("");
    try { await refresh({ operation: "refresh", id, body: {} }).unwrap(); }
    catch (failure) { setError(userMessage(failure)); }
  }
  return <ConfirmationModal open title="Sale details" description="Payment details and the automatically calculated earnings breakdown." dismissOnly onCancel={onClose} busy={refreshing.isLoading}>
    <QueryMessage query={{ loading: !sale && !query.isError, error: query.error, refresh: query.refetch }} label="Loading sale details" compact />
    {sale && <div className="revenue-dialog-content"><h3>{sale.courseTitle}</h3><p>{sale.instructorName} · {sale.mode} payment</p>
      <dl className="revenue-detail">{[["Gross payment", sale.grossMinor], ["Refunded", sale.refundedMinor], ["Gateway fee (including its GST)", sale.gatewayFeeMinor], ["GST (18%, included in price)", sale.salesTaxMinor], ["Refunded sales tax", sale.refundedTaxMinor], ["Shareable net sales", sale.shareableMinor], ["Instructor earnings (50%)", sale.earnedMinor], ["Platform share", sale.platformMinor]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{moneyText(value, sale.currency, sale.currencyExponent)}</dd></div>)}</dl>
      <p>Payment verified: {dateText(sale.earnedAt)} · Hold ends: {dateText(sale.availableAt)}</p>
      {sale.reviewReasons.length > 0 && <div className="revenue-notice"><strong>Payment exception</strong><ul>{sale.reviewReasons.map(reason => <li key={reason}>{reason}</li>)}</ul></div>}
      {admin && <><p className="revenue-note">Payment reference: {sale.paymentId}</p><AsyncButton className="cw-button" loading={refreshing.isLoading} loadingLabel="Verifying payment" onClick={verify}>Refresh from Razorpay</AsyncButton>{error && <p className="cw-error" role="alert">{error}</p>}</>}
      <details><summary>Revenue audit history</summary><ol className="revenue-history">{query.currentData.entries.map(entry => <li key={entry.id}><strong>{moneyText(entry.amountMinor, sale.currency, sale.currencyExponent)}</strong> · {dateText(entry.createdAt)}<p>{entry.source === "provider" ? "Verified payment update" : "Admin update"}{entry.note && ` · ${entry.note}`}</p></li>)}</ol></details>
    </div>}
  </ConfirmationModal>;
}
function PayoutDialog({ dialog, onClose }) {
  const [mutate, mutation] = revenueApi.endpoints.revenueAction.useMutation();
  const [error, setError] = useState("");
  const key = useRef(crypto.randomUUID());
  const form = useRef(null);
  const { payout, action } = dialog;
  const creating = dialog.type === "payout", currency = payout?.currency || dialog.currency, exponent = payout?.currencyExponent ?? dialog.exponent;
  const [period, setPeriod] = useState(() => dialog.salesPeriod || suggestedSalesPeriod());
  const quoteQuery = revenueApi.endpoints.getRevenue.useQuery({ admin: true, view: "payout-quote", instructorId: dialog.row?.id, currency, period }, { skip: !creating || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(period), refetchOnMountOrArgChange: true });
  const quote = quoteQuery.currentData?.period === period ? quoteQuery.currentData : null;
  const titles = { approve: "Approve instructor payout", start: "Begin external transfer", paid: "Record completed transfer", cancel: "Cancel reserved payout", fail: "Confirm transfer failure" };
  async function submit(event) {
    event?.preventDefault();
    if (!form.current.reportValidity() || (creating && (!quote?.canPrepare || quoteQuery.isFetching || quoteQuery.isError))) return;
    const data = new FormData(form.current); setError("");
    let body;
    try {
      body = creating ? { instructorId: dialog.row.id, currency, period: data.get("period"), idempotencyKey: key.current, confirm: true }
        : { action, revision: payout.revision, requestKey: key.current, note: data.get("note"), confirm: true,
          ...(action === "approve" && { withholdingMinor: parseMoney(data.get("withholding"), exponent), beneficiaryLabel: data.get("beneficiary"), taxReviewed: true }),
          ...(action === "start" && { settlementReference: data.get("settlement"), fundsConfirmed: true }),
          ...(action === "paid" && { transferMinor: parseMoney(data.get("transfer"), exponent), transferReference: data.get("reference"), paidAt: new Date(data.get("paidAt")).toISOString(), beneficiaryConfirmed: true }),
          ...(action === "fail" && { noFundsTransferred: true }) };
    } catch (failure) { setError(failure.message); return; }
    try { await mutate({ operation: creating ? "payout" : "payoutAction", id: payout?.id, body }).unwrap(); onClose(); }
    catch (failure) { setError(userMessage(failure)); }
  }
  return <ConfirmationModal open title={creating ? "Prepare monthly payout" : titles[action]} description={creating ? "Choose a complete sales month. The server checks its 30-day hold, schedule, and any previous adjustments before reserving funds." : "This records a manual payout decision. It does not send money."} confirmLabel={creating ? "Reserve payout" : action === "paid" ? "Confirm paid" : "Save decision"} confirmDisabled={creating && (!quote?.canPrepare || quoteQuery.isFetching || quoteQuery.isError)} busy={mutation.isLoading} onConfirm={submit} onCancel={onClose}>
    <form ref={form} onSubmit={submit} className="revenue-form"><h3>{payout?.instructorName || dialog.row.name}</h3><p>Gross payout: {moneyText(payout?.amountMinor ?? quote?.amountMinor ?? null, currency, exponent)}</p>
      <fieldset disabled={mutation.isLoading}>
        {creating ? <><Field label="Sales month (India time)" name="period" type="month" max={currentPeriod()} required value={period} onChange={event => { setPeriod(event.target.value); key.current = crypto.randomUUID(); if (form.current?.elements.confirm) form.current.elements.confirm.checked = false; }} />
          <QueryMessage query={{ loading: quoteQuery.isFetching, error: quoteQuery.error, refresh: quoteQuery.refetch }} label="Checking monthly statement" compact />
          {quote && !quoteQuery.isError && <><dl className="revenue-detail"><div><dt>This month’s earnings</dt><dd>{moneyText(quote.periodEarningsMinor, currency, exponent)}</dd></div><div><dt>Earlier statement adjustments</dt><dd>{moneyText(quote.adjustmentMinor, currency, exponent)}</dd></div><div><dt>Scheduled payout</dt><dd>{dateText(quote.scheduledAt)}</dd></div></dl>{quote.earlierUnpaidPeriod && <p className="revenue-note">Earlier unpaid sales month: {quote.earlierUnpaidPeriod}</p>}{quote.reasons?.length > 0 && <ul className="revenue-notice">{quote.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}</>}
          <Confirm>Reserve this complete sales month for manual payout. Test payments and unresolved sales cannot be paid out.</Confirm></> : <>
          {action === "approve" && <><Field label={`Payout withholding, if applicable (${currency})`} name="withholding" inputMode="decimal" defaultValue="0" required /><p className="revenue-note">Applicable GST is already included in sale calculations. Do not deduct it a second time here.</p><Field label="Verified beneficiary (masked)" name="beneficiary" placeholder="Name · bank account ending 1234" required minLength={3} maxLength={100} /><Confirm>I reviewed applicable withholding and verified the payout beneficiary. I am not storing full bank details here.</Confirm></>}
          {action === "start" && <><p>Net amount to transfer: <strong>{moneyText(payout.transferMinor, currency, exponent)}</strong></p><Field label="Settlement / reconciliation reference" name="settlement" required minLength={3} maxLength={150} /><Confirm>I confirmed settled funds, reviewed the beneficiary, and will initiate the external transfer. If its result is uncertain, I will leave this payout processing.</Confirm></>}
          {action === "paid" && <><Field label={`Actual transfer amount (${currency})`} name="transfer" inputMode="decimal" defaultValue={moneyInput(payout.transferMinor, exponent)} required /><Field label="Bank transfer / UTR reference" name="reference" pattern="[a-zA-Z0-9_-]{6,100}" minLength={6} maxLength={100} required /><Field label="Transfer completed on" name="paidAt" type="datetime-local" step="1" defaultValue={localDateTime()} required /><Confirm>I verified the completed transfer, exact amount, beneficiary, and any tax withholding records. Paid payouts cannot be reversed in this dashboard.</Confirm></>}
          {action === "cancel" && <Confirm>Cancel this payout reservation. No transfer has started; earnings will become available again.</Confirm>}
          {action === "fail" && <Confirm>The bank confirmed that no funds were transferred. I am not marking an uncertain or pending transfer as failed.</Confirm>}
          <Note />
        </>}
      </fieldset>
      {error && <p className="cw-error" role="alert">{error}</p>}
    </form>
  </ConfirmationModal>;
}
export default function RevenueDialogs({ dialog, admin, onClose }) {
  return dialog.type === "sale" ? <SaleDialog id={dialog.id} admin={admin} onClose={onClose} /> : <PayoutDialog dialog={dialog} onClose={onClose} />;
}
