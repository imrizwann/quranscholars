import { useRef, useState } from "react";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import revenueApi from "@/services/api/revenueApi.js";
import { userMessage } from "@/lib/user-messages.js";
import { currentPeriod, dateText, localDateTime, moneyInput, moneyText, parseMoney } from "./revenue-utils.js";
import useDebouncedValue from "@/hooks/useDebouncedValue.js";

function Field({ name, label, ...props }) { return <label className="revenue-field">{label}<input name={name} {...props} /></label>; }
function Note() { return <label className="revenue-field">Review note<textarea name="note" required minLength={10} maxLength={500} rows={3} placeholder="Record the basis for this decision." /></label>; }
function Confirm({ children }) { return <label className="revenue-confirm"><input type="checkbox" name="confirm" required /> <span>{children}</span></label>; }
function ReviewForm({ sale, onBusy, refreshing }) {
  const [mutate, mutation] = revenueApi.endpoints.revenueAction.useMutation();
  const [error, setError] = useState("");
  const [search, setSearch] = useState(""), [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 250);
  const [instructorId, setInstructorId] = useState(sale.candidateInstructor?.id || "");
  const instructors = revenueApi.endpoints.getRevenue.useQuery({ admin: true, view: "instructors", search: debouncedSearch, page }, { skip: sale.attributionReviewed });
  const exponent = sale.currencyExponent;
  async function submit(event) {
    event.preventDefault(); setError("");
    const data = new FormData(event.currentTarget);
    let body;
    try {
      body = { revision: sale.revision, ...(sale.attributionReviewed ? {} : { instructorId }), salesTaxMinor: parseMoney(data.get("tax"), exponent), refundedTaxMinor: parseMoney(data.get("refundedTax"), exponent), settledAt: new Date(data.get("settledAt")).toISOString(), note: data.get("note"), confirm: true };
    } catch (failure) { setError(failure.message); return; }
    onBusy(true);
    try { await mutate({ operation: "review", id: sale.id, body }).unwrap(); }
    catch (failure) { setError(userMessage(failure)); }
    finally { onBusy(false); }
  }
  const owners = instructors.currentData?.items || [];
  const selected = sale.candidateInstructor;
  const options = [...(selected && !owners.some(owner => owner.id === selected.id) ? [selected] : []), ...owners].map(owner => ({ value: owner.id, label: `${owner.name} · ${owner.id.slice(-6)}` }));
  return <form onSubmit={submit} className="revenue-form" aria-busy={mutation.isLoading}>
    <h3>Financial review</h3><p>{sale.mode === "test" ? "Use simulated tax and settlement details to test the calculation. These earnings can never be paid out." : "Use actual sale and settlement records. Enter sales tax separately from the gateway fee’s GST. Confirm zero only if the sale has no applicable sales tax."}</p>
    <fieldset disabled={mutation.isLoading || refreshing}>
      {!sale.attributionReviewed && <><Field label="Find original instructor" name="instructor-search" maxLength={80} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /><SelectField label="Original sale instructor" name="instructorId" required value={instructorId} onChange={setInstructorId} options={options} loading={instructors.isFetching} />{instructors.isError && <p className="cw-error">{userMessage(instructors.error)}</p>}<div className="revenue-row">{page > 1 && <button className="cw-button" type="button" onClick={() => setPage(page - 1)}>Previous instructors</button>}{instructors.currentData?.hasNextPage && <button className="cw-button" type="button" onClick={() => setPage(page + 1)}>More instructors</button>}</div><p>The current course owner is a suggestion. Confirm who owned the course when this sale occurred.</p></>}
      <Field label={`Original sales tax (${sale.currency})`} name="tax" inputMode="decimal" required defaultValue={moneyInput(sale.salesTaxMinor, exponent)} />
      <Field label={`Sales tax returned in refunds (${sale.currency})`} name="refundedTax" inputMode="decimal" required defaultValue={moneyInput(sale.refundedTaxMinor ?? 0, exponent)} />
      <Field label={sale.mode === "test" ? "Simulated settlement date" : "Funds settled on"} name="settledAt" type="datetime-local" step="1" required defaultValue={localDateTime(sale.settledAt)} />
      <Note /><Confirm>{sale.mode === "test" ? "I am reviewing a sandbox payment. These simulated earnings will never become payable." : "I verified the instructor, applicable sales tax, refund tax, and actual funds received in settlement."}</Confirm>
    </fieldset>
    {error && <p className="cw-error" role="alert">{error}</p>}
    <AsyncButton type="submit" className="cw-button cw-primary" loading={mutation.isLoading} loadingLabel="Saving review" disabled={refreshing || sale.gatewayFeeMinor == null || sale.reviewReasons.includes("Refund details need verification")}>Save financial review</AsyncButton>
  </form>;
}
function SaleDialog({ id, admin, onClose }) {
  const query = revenueApi.endpoints.getRevenue.useQuery({ admin, view: "sales", id }, { refetchOnMountOrArgChange: true });
  const [refresh, refreshing] = revenueApi.endpoints.revenueAction.useMutation();
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const sale = query.currentData?.sale;
  async function verify() {
    setError("");
    try { await refresh({ operation: "refresh", id, body: {} }).unwrap(); }
    catch (failure) { setError(userMessage(failure)); }
  }
  return <ConfirmationModal open title="Sale details" description="Review the payment, revenue calculation, and audit history." confirmLabel="Close" onConfirm={onClose} onCancel={onClose} busy={refreshing.isLoading || reviewing}>
    <QueryMessage query={{ loading: !sale && !query.isError, error: query.error, refresh: query.refetch }} label="Loading sale details" compact />
    {sale && <div className="revenue-dialog-content"><h3>{sale.courseTitle}</h3><p>{sale.instructorName} · {sale.mode} payment</p>
      <dl className="revenue-detail">{[["Gross payment", sale.grossMinor], ["Refunded", sale.refundedMinor], ["Gateway fee (including its GST)", sale.gatewayFeeMinor], ["Original sales tax", sale.salesTaxMinor], ["Refunded sales tax", sale.refundedTaxMinor], ["Shareable net sales", sale.shareableMinor], ["Instructor earnings (50%)", sale.earnedMinor], ["Platform share", sale.platformMinor]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{moneyText(value, sale.currency, sale.currencyExponent)}</dd></div>)}</dl>
      <p>Payment verified: {dateText(sale.earnedAt)} · Hold ends: {dateText(sale.availableAt)}</p>
      {sale.reviewReasons.length > 0 && <div className="revenue-notice"><strong>Awaiting review</strong><ul>{sale.reviewReasons.map(reason => <li key={reason}>{reason}</li>)}</ul></div>}
      {admin && <><p className="revenue-note">Payment reference: {sale.paymentId}</p><AsyncButton className="cw-button" loading={refreshing.isLoading} loadingLabel="Verifying payment" disabled={reviewing} onClick={verify}>Refresh from Razorpay</AsyncButton>{error && <p className="cw-error" role="alert">{error}</p>}<ReviewForm key={sale.revision} sale={sale} onBusy={setReviewing} refreshing={refreshing.isLoading} /></>}
      <details><summary>Revenue audit history</summary><ol className="revenue-history">{query.currentData.entries.map(entry => <li key={entry.id}><strong>{moneyText(entry.amountMinor, sale.currency, sale.currencyExponent)}</strong> · {dateText(entry.createdAt)}<p>{entry.source === "provider" ? "Verified payment update" : "Financial review"}{entry.note && ` · ${entry.note}`}</p></li>)}</ol></details>
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
  const titles = { approve: "Approve instructor payout", start: "Begin external transfer", paid: "Record completed transfer", cancel: "Cancel reserved payout", fail: "Confirm transfer failure" };
  async function submit(event) {
    event?.preventDefault();
    if (!form.current.reportValidity()) return;
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
  return <ConfirmationModal open title={creating ? "Prepare monthly payout" : titles[action]} description={creating ? "Reserve all currently available live earnings for this instructor. The server calculates the amount again before saving." : "This records a manual payout decision. It does not send money."} confirmLabel={creating ? "Reserve payout" : action === "paid" ? "Confirm paid" : "Save decision"} busy={mutation.isLoading} onConfirm={submit} onCancel={onClose}>
    <form ref={form} onSubmit={submit} className="revenue-form"><h3>{payout?.instructorName || dialog.row.name}</h3><p>Gross payout: {moneyText(payout?.amountMinor ?? dialog.row.balance.availableMinor, currency, exponent)}</p>
      <fieldset disabled={mutation.isLoading}>
        {creating ? <><Field label="Reporting month (UTC)" name="period" type="month" min={currentPeriod()} max={currentPeriod()} required defaultValue={currentPeriod()} /><Confirm>Reserve these live earnings for manual payout. I understand test payments and unreviewed sales are excluded.</Confirm></> : <>
          {action === "approve" && <><Field label={`Actual tax withholding (${currency})`} name="withholding" inputMode="decimal" defaultValue="" required /><Field label="Verified beneficiary (masked)" name="beneficiary" placeholder="Name · bank account ending 1234" required minLength={3} maxLength={100} /><Confirm>I reviewed applicable withholding and verified the payout beneficiary. I am not storing full bank details here.</Confirm></>}
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
