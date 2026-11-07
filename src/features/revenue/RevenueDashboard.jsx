import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Banknote, Clock3, Receipt, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import { DashboardMetrics } from "@/components/lms/DashboardParts.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import revenueApi from "@/services/api/revenueApi.js";
import { userMessage } from "@/lib/user-messages.js";
import { moneyText, dateText, payoutActions } from "./revenue-utils.js";
import RevenueDialogs from "./RevenueDialogs.jsx";
import RevenueCalculation from "./RevenueCalculation.jsx";
import "@/components/lms/dashboard-analytics.css";
import "./revenue.css";

const queryOptions = { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true };
const labels = { approve: "Review & approve", start: "Begin transfer", paid: "Record payment", cancel: "Cancel payout", fail: "Confirm transfer failed" };
export default function RevenueDashboard({ admin = false }) {
  const [view, setView] = useState("summary"), [page, setPage] = useState(1);
  const [currency, setCurrency] = useState("INR"), [period, setPeriod] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get("payments");
  const mode = ["live", "test", "all", ...(admin ? ["unknown"] : [])].includes(requestedMode) ? requestedMode : "live";
  const setMode = value => setSearchParams(previous => {
    const next = new URLSearchParams(previous);
    if (value === "live") next.delete("payments"); else next.set("payments", value);
    return next;
  }, { replace: true });
  const [dialog, setDialog] = useState(null), [syncState, setSyncState] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const params = { admin, currency, mode, period: period || "all", page, limit: 10, ...(admin && instructor && { instructorId: instructor.id }) };
  const summary = revenueApi.endpoints.getRevenue.useQuery({ ...params, view: "summary" }, queryOptions);
  const detail = revenueApi.endpoints.getRevenue.useQuery({ ...params, view }, { ...queryOptions, skip: view === "summary" });
  const [mutate, mutation] = revenueApi.endpoints.revenueAction.useMutation();
  const data = summary.isError ? null : summary.currentData, content = view === "summary" ? summary : detail;
  const report = content.isError ? null : content.currentData;
  const format = value => moneyText(value, currency, data?.currencyExponent ?? 2);
  const change = setter => value => { setter(value); setPage(1); };
  const refresh = () => { summary.refetch(); if (view !== "summary") detail.refetch(); };
  async function sync() {
    try {
      const result = await mutate({ operation: "sync", body: { ...(syncState?.hasNextPage && { cursor: syncState.cursor }), limit: 5 } }).unwrap();
      setSyncState({ ...result, total: (syncState?.hasNextPage ? syncState.total : 0) + result.processed, failures: (syncState?.hasNextPage ? syncState.failures : 0) + result.failed.length });
    } catch (error) { setSyncState(previous => ({ ...previous, error: userMessage(error) })); }
  }
  const metrics = [
    { label: "Available for payout", key: "availableMinor", icon: Wallet, note: "Live sales · reviewed and held for 30 days" },
    { label: "In holding period", key: "heldMinor", icon: Clock3, note: "Reviewed live earnings awaiting release" },
    { label: "Payouts in progress", key: "reservedMinor", icon: Receipt, note: "Reserved for monthly transfers" },
    { label: "Paid to instructors", key: "paidMinor", icon: Banknote, note: "Gross payouts, including any withholding" },
  ];
  return <WorkspacePage eyebrow={admin ? "Administration" : "Teaching workspace"} title={admin ? "Revenue & payouts" : "Your earnings"} description={admin ? "Review course sales and manage monthly instructor payments." : "Track your course earnings and monthly payment history."} action={<AsyncButton className="cw-button" onClick={refresh} loading={content.isFetching} loadingLabel="Updating"><RefreshCw size={16} />Refresh</AsyncButton>}>
    <div className="analytics-metrics"><DashboardMetrics items={metrics.map(item => ({ ...item, label: !admin && item.key === "paidMinor" ? "Paid to you" : item.label, value: data ? format(data.balance[item.key]) : summary.isError ? "Unavailable" : undefined, loading: !data && !summary.isError }))} /></div>
    {data?.balance.carryForwardMinor > 0 && <p className="cw-error">{format(data.balance.carryForwardMinor)} will be offset against future earnings following refunds or adjustments. Other instructors’ balances are unaffected.</p>}
    <aside className="studio-panel revenue-policy"><ShieldCheck size={22} aria-hidden="true" /><div><h2>Clear, reviewed earnings</h2><p>Your share is 50% of each sale after refunds, sales tax, and actual payment gateway fees. Advertising is covered by the platform’s share. Live payouts require confirmed tax treatment, settled funds, and a 30-day hold. Test sales never become payable.</p></div></aside>
    <div className="revenue-filters">
      <SelectField label="Currency" name="revenue-currency" options={(data?.currencies || [currency]).map(value => ({ value, label: value }))} value={currency} onChange={change(setCurrency)} />
      <SelectField label="Sales" name="revenue-mode" value={mode} onChange={change(setMode)} options={[{ value: "live", label: "Live payments" }, { value: "test", label: "Test payments" }, { value: "all", label: "All payments" }, ...(admin ? [{ value: "unknown", label: "Mode needs review" }] : [])]} />
      <label className="revenue-field">Reporting month (UTC)<input name="revenue-period" type="month" value={period} min="2000-01" max="2099-12" onChange={event => change(setPeriod)(event.target.value)} /></label>
      {period && <button className="cw-button" onClick={() => change(setPeriod)("")}>All months</button>}
    </div>
    {mode === "live" && data?.totals.sales === 0 && data?.availableModes?.test > 0 && <div className="revenue-notice revenue-row"><p>This view shows live payments. You have {data.availableModes.test} test {data.availableModes.test === 1 ? "sale" : "sales"} available to review.</p><button type="button" className="cw-button" onClick={() => change(setMode)("test")}>View test earnings</button></div>}
    {admin && instructor && <div className="revenue-row revenue-notice"><p>Viewing {instructor.name}</p><div className="revenue-row"><button className="cw-button" onClick={() => { setInstructor(null); setPage(1); }}>All instructors</button><button className="cw-button" disabled={!data?.balance.availableMinor} onClick={() => setDialog({ type: "payout", row: { ...instructor, balance: data.balance }, currency, exponent: data.currencyExponent })}>Prepare payout</button></div></div>}
    {mode !== "live" && <p className="revenue-notice">{mode === "test" ? "Test transactions are for verification only and cannot be paid out." : "This report includes payments that may not be eligible for payout."} The balances above always show live earnings across all months.</p>}
    <nav className="revenue-tabs" aria-label="Revenue reports">{[["summary", "Overview"], ["sales", "Sales ledger"], ["payouts", "Payout history"]].map(([key, label]) => <button key={key} type="button" aria-current={view === key ? "page" : undefined} onClick={() => { setView(key); setPage(1); }}>{label}</button>)}</nav>
    <QueryMessage query={{ loading: !report && !content.isError, error: content.error, data: report, refresh }} label="Loading revenue report" />
    {report && <section className="studio-panel revenue-panel" aria-busy={content.isFetching}>
      {view === "summary" ? <>
        <div className="studio-section-title"><h2>{admin ? "Combined sales" : "Course sales"}</h2></div>
        <dl className="revenue-totals">{[["Verified sales", report.totals.sales], ["Gross sales", format(report.totals.grossMinor)], ["Refunds", format(report.totals.refundedMinor)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <RevenueCalculation totals={report.totals} currency={currency} exponent={data?.currencyExponent ?? 2} mode={mode} admin={admin} />
        <p className="revenue-note">{report.totals.reviewPending} sale(s) awaiting financial review. {report.totals.feePending > 0 && `${report.totals.feePending} gateway fee(s) not yet verified.`} Reviewed earnings and platform share exclude unresolved sales. Platform share is before advertising and operating costs.</p>
        {!report.groups.length ? <p className="analytics-empty">No sales match these filters. Your verified course payments will appear here.</p> : <div className="revenue-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">{report.groupBy === "instructor" ? "Instructor" : "Course"}</th><th scope="col">Sales</th><th scope="col">Gross sales</th><th scope="col">Earnings</th>{admin && report.groupBy === "instructor" && <th scope="col">Payout</th>}</tr></thead><tbody>{report.groups.map(row => <tr key={row.id || "unattributed"}><th scope="row">{admin && report.groupBy === "instructor" && row.id ? <button className="cw-text-link" onClick={() => { setInstructor({ id: row.id, name: row.name }); setPage(1); }}>{row.name}</button> : row.name}</th><td data-label="Sales">{row.sales}</td><td data-label="Gross sales">{format(row.grossMinor)}</td><td data-label="Earnings">{format(row.earnedMinor)}</td>{admin && report.groupBy === "instructor" && <td data-label="Live available">{row.balance ? <><span>{format(row.balance.availableMinor)}</span><button type="button" className="cw-button" disabled={!row.balance.availableMinor} onClick={() => setDialog({ type: "payout", row, currency, exponent: data.currencyExponent })}>Prepare payout</button></> : "Review attribution"}</td>}</tr>)}</tbody></table></div>}
      </> : view === "sales" ? <>
        <h2>Sales ledger</h2><p className="revenue-note">The policy and instructor are fixed at checkout. Financial reviews and refunds remain in the audit history.</p>
        {!report.items.length ? <p className="analytics-empty">No sales match these filters.</p> : <div className="revenue-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">Course / sale date</th><th scope="col">Payment</th><th scope="col">Earnings</th><th scope="col">Review</th></tr></thead><tbody>{report.items.map(sale => <tr key={sale.id}><th scope="row">{sale.courseTitle}<small>{dateText(sale.earnedAt)}{admin && ` · ${sale.instructorName}`}</small></th><td data-label="Payment">{format(sale.grossMinor)}<small>{sale.mode} · {sale.status.replaceAll("_", " ")}</small>{sale.refundedMinor > 0 && <small>Refunded {format(sale.refundedMinor)}</small>}</td><td data-label="Earnings">{format(sale.earnedMinor)}<small>{sale.reviewReasons.length ? "Awaiting review" : `Hold ends ${dateText(sale.availableAt)}`}</small></td><td data-label="Details"><button className="cw-button" onClick={() => setDialog({ type: "sale", id: sale.id })}>{admin ? "Review sale" : "View details"}</button></td></tr>)}</tbody></table></div>}
      </> : <>
        <h2>Monthly payout history</h2><p className="revenue-note">Payments are transferred outside QuranScholar. A paid status records a confirmed transfer; preparing or approving a payout does not send money. Payouts include available earnings carried forward from earlier months.</p>
        {!report.items.length ? <p className="analytics-empty">No payouts recorded for this currency and reporting period.</p> : <div className="revenue-payouts">{report.items.map(payout => <article key={payout.id} className="revenue-payout"><div className="revenue-row"><div><h3>{admin ? payout.instructorName : `Payout · ${payout.period}`}</h3><p>{payout.period} · {dateText(payout.createdAt)}</p></div><span className="cw-publication-status revenue-status" data-status={payout.status}>{payout.status}</span></div><dl className="revenue-totals"><div><dt>Gross payout</dt><dd>{format(payout.amountMinor)}</dd></div><div><dt>Withholding</dt><dd>{format(payout.withholdingMinor)}</dd></div><div><dt>Net transfer</dt><dd>{format(payout.transferMinor)}</dd></div></dl>{payout.beneficiaryLabel && <p>Beneficiary: {payout.beneficiaryLabel}</p>}{payout.transferReference && <p>Transfer reference: {payout.transferReference} · {dateText(payout.paidAt)}</p>}<details><summary>Activity history</summary><ol className="revenue-history">{payout.events.map((event, index) => <li key={index}><strong>{event.action}</strong> · {dateText(event.at)}{event.note && <p>{event.note}</p>}</li>)}</ol></details>{admin && <div className="revenue-row">{payoutActions(payout.status).map(action => <button className="cw-button" key={action} onClick={() => setDialog({ type: "payoutAction", payout, action })}>{labels[action]}</button>)}</div>}</article>)}</div>}
      </>}
      <Pagination pagination={report.pagination} page={page} onPage={setPage} loading={content.isFetching} />
    </section>}
    {admin && <section className="studio-panel revenue-sync"><div><h2>Reconcile verified payments</h2><p>Import existing sales and refresh fees or refunds directly from Razorpay, five payments at a time. Test and live credentials can only verify their own payments.</p>{data?.unrecorded > 0 && <p>{data.unrecorded} verified payment(s) have no revenue record yet.</p>}</div><AsyncButton className="cw-button" loading={mutation.isLoading} loadingLabel="Reconciling" onClick={sync}>{syncState?.hasNextPage ? "Reconcile next 5" : "Reconcile payments"}</AsyncButton>{syncState && <p role="status">{syncState.error || `${syncState.total} payment(s) checked; ${syncState.failures} need further review. ${syncState.hasNextPage ? "Continue with the next batch." : "Reconciliation complete."}`}</p>}</section>}
    {dialog && <RevenueDialogs key={`${dialog.type}-${dialog.id || dialog.payout?.id || dialog.row?.id}-${dialog.action || ""}`} dialog={dialog} admin={admin} onClose={() => setDialog(null)} />}
  </WorkspacePage>;
}
