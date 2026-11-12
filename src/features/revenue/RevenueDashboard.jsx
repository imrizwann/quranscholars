import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Banknote, ChevronDown, Clock3, Receipt, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import { DashboardMetrics } from "@/components/lms/DashboardParts.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import DateRangePicker from "@/components/ui/DateRangePicker.jsx";
import useDebouncedValue from "@/hooks/useDebouncedValue.js";
import revenueApi from "@/services/api/revenueApi.js";
import { userMessage } from "@/lib/user-messages.js";
import { moneyText, dateText, payoutActions, salesMonthOptions, businessDate } from "./revenue-utils.js";
import RevenueDialogs from "./RevenueDialogs.jsx";
import RevenueCalculation from "./RevenueCalculation.jsx";
import "@/components/lms/dashboard-analytics.css";
import "./revenue.css";

const queryOptions = { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true, pollingInterval: 30_000, skipPollingIfUnfocused: true };
const labels = { approve: "Review & approve", start: "Begin transfer", paid: "Record payment", cancel: "Cancel payout", fail: "Confirm transfer failed" };
export default function RevenueDashboard({ admin = false }) {
  const accountKey = useSelector(state => `${state.user?.user?._id || ""}:${state.user?.user?.role || ""}`);
  return <RevenueWorkspace key={accountKey} admin={admin} />;
}
function RevenueWorkspace({ admin }) {
  const [view, setView] = useState("summary"), [page, setPage] = useState(1);
  const [currency, setCurrency] = useState("INR"), [period, setPeriod] = useState("");
  const [dateRange, setDateRange] = useState({ fromDate: "", toDate: "" });
  const [sort, setSort] = useState("newest"), [status, setStatus] = useState("all");
  const [instructorSearch, setInstructorSearch] = useState("");
  const debouncedInstructorSearch = useDebouncedValue(instructorSearch, 250);
  const instructorsQuery = revenueApi.endpoints.getRevenue.useQuery({ admin: true, view: "instructors", search: debouncedInstructorSearch, page: 1 }, { skip: !admin });
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get("payments");
  const mode = ["live", "test", "all", ...(admin ? ["unknown"] : [])].includes(requestedMode) ? requestedMode : "live";
  const setMode = value => setSearchParams(previous => {
    const next = new URLSearchParams(previous);
    if (value === "live") next.delete("payments"); else next.set("payments", value);
    return next;
  }, { replace: true });
  const [dialog, setDialog] = useState(null), [syncState, setSyncState] = useState(null);
  const syncRun = useRef(null);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => () => { syncRun.current = null; }, []);
  const [instructor, setInstructor] = useState(null);
  const monthly = revenueApi.endpoints.getRevenue.useQuery({ admin, view: "payout-quote", period, currency, ...(instructor && { instructorId: instructor.id }) }, { ...queryOptions, skip: !period || mode !== "live" || (admin && !instructor) });
  const params = { admin, currency, mode, period: period || "all", page, limit: 10,
    ...(sort !== "newest" && { sort }), ...(status !== "all" && { status }),
    ...(dateRange.fromDate && { fromDate: dateRange.fromDate }), ...(dateRange.toDate && { toDate: dateRange.toDate }),
    ...(admin && instructor && { instructorId: instructor.id }) };
  const summaryParams = { ...params, page: 1 };
  delete summaryParams.sort;
  const tableUsesSummary = view === "summary" && sort === "newest" && page === 1;
  const summary = revenueApi.endpoints.getRevenue.useQuery({ ...summaryParams, view: "summary" }, queryOptions);
  const detail = revenueApi.endpoints.getRevenue.useQuery({ ...params, view }, { ...queryOptions, skip: tableUsesSummary });
  const [mutate, mutation] = revenueApi.endpoints.revenueAction.useMutation();
  const data = summary.isError ? null : summary.currentData, content = tableUsesSummary ? summary : detail;
  const report = content.isError ? null : content.currentData;
  const canSortSummary = (data?.pagination?.total || 0) > 1;
  const format = value => moneyText(value, currency, data?.currencyExponent ?? 2);
  const change = setter => value => { setter(value); setPage(1); };
  const owners = instructorsQuery.currentData?.items || [];
  const ownerOptions = [{ value: "all", label: "All instructors" }, ...(instructor && !owners.some(owner => owner.id === instructor.id) ? [{ value: instructor.id, label: instructor.name }] : []), ...owners.map(owner => ({ value: owner.id, label: owner.name }))];
  const sortOptions = view === "summary" ? [
    { value: "newest", label: "Gross sales: high to low" }, { value: "oldest", label: "Gross sales: low to high" },
    { value: "earnings_desc", label: "Earnings: high to low" }, { value: "earnings_asc", label: "Earnings: low to high" },
    { value: "sales_desc", label: "Sales count: high to low" }, { value: "sales_asc", label: "Sales count: low to high" },
    { value: "title_asc", label: "Name: A to Z" }, { value: "title_desc", label: "Name: Z to A" },
  ] : view === "payouts" ? [
    { value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "amount_desc", label: "Highest amount" }, { value: "amount_asc", label: "Lowest amount" },
  ] : [
    { value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" },
    { value: "amount_desc", label: "Highest amount" }, { value: "amount_asc", label: "Lowest amount" },
    { value: "earnings_desc", label: "Highest earnings" }, { value: "earnings_asc", label: "Lowest earnings" },
    { value: "title_asc", label: "Name A to Z" }, { value: "title_desc", label: "Name Z to A" },
  ];
  const refresh = () => { summary.refetch(); if (!tableUsesSummary) detail.refetch(); };
  async function sync() {
    if (syncRun.current) return;
    const run = {};
    syncRun.current = run;
    setSyncing(true);
    let progress = syncState?.hasNextPage ? syncState : { total: 0, failures: 0 };
    try {
      do {
        const result = await mutate({ operation: "sync", body: { ...(progress.hasNextPage && { cursor: progress.cursor }), limit: 5 } }).unwrap();
        if (syncRun.current !== run) return;
        progress = { ...result, total: progress.total + result.processed, failures: progress.failures + result.failed.length };
        setSyncState(progress);
        // Bounded requests keep Vercel work small and respect the admin rate limit.
        if (progress.hasNextPage) await new Promise(resolve => setTimeout(resolve, 2500));
      } while (progress.hasNextPage && syncRun.current === run);
    } catch (error) {
      if (syncRun.current === run) setSyncState({ ...progress, error: userMessage(error) });
    } finally {
      if (syncRun.current === run) { syncRun.current = null; setSyncing(false); }
    }
  }
  const metrics = [
    { label: "Matured earnings", key: "availableMinor", icon: Wallet, note: "Subject to the full-month payout schedule" },
    { label: "In holding period", key: "heldMinor", icon: Clock3, note: "Verified live earnings awaiting release" },
    { label: "Payouts in progress", key: "reservedMinor", icon: Receipt, note: "Reserved for monthly transfers" },
    { label: "Paid to instructors", key: "paidMinor", icon: Banknote, note: "Gross payouts, including any withholding" },
  ];
  return <WorkspacePage eyebrow={admin ? "Administration" : "Teaching workspace"} title={admin ? "Revenue & payouts" : "Your earnings"} description={admin ? "Track course sales, GST, earnings, and recorded instructor payouts." : "Track your course earnings and monthly payment history."} action={<AsyncButton className="cw-button" onClick={refresh} loading={content.isFetching} loadingLabel="Updating"><RefreshCw size={16} />Refresh</AsyncButton>}>
    <div className="revenue-report-heading"><div><h2>Live payout balances</h2><p className="revenue-note">{instructor ? `For ${instructor.name}. ` : ""}Across all sales months in {currency}. The report filters below do not change these time periods.</p></div></div>
    <div className="analytics-metrics"><DashboardMetrics items={metrics.map(item => ({ ...item, label: !admin && item.key === "paidMinor" ? "Paid to you" : item.label, value: data ? format(data.balance[item.key]) : summary.isError ? "Unavailable" : undefined, loading: !data && !summary.isError }))} /></div>
    {data?.balance.carryForwardMinor > 0 && <p className="cw-error">{format(data.balance.carryForwardMinor)} will be offset against future earnings following refunds or adjustments. Other instructors’ balances are unaffected.</p>}
    <details className="studio-panel revenue-policy"><summary><ShieldCheck size={20} aria-hidden="true" /><span>How earnings are calculated</span><ChevronDown size={16} aria-hidden="true" /></summary><p>Course prices include 18% GST. We calculate GST, verified gateway fees, and the 50% instructor share automatically from confirmed sales. Statements cover complete calendar months in India time, with a 30-day hold. Test sales never become payable.</p></details>
    <nav className="revenue-tabs" aria-label="Revenue reports">{[["summary", "Overview"], ["sales", "Sales ledger"], ["payouts", "Payout history"]].map(([key, label]) => <button key={key} type="button" aria-current={view === key ? "page" : undefined} onClick={() => { setView(key); setSort("newest"); if (key !== "sales") setStatus("all"); setPage(1); }}>{label}</button>)}</nav>
    <section className="revenue-report-filters" aria-label="Report filters"><h2>Report filters</h2><p className="revenue-note">Filter the {view === "summary" ? "sales overview" : view === "sales" ? "sales ledger" : "payout history"} below. Payout balances above always reflect live payments across all months.</p><div className="revenue-filters">
      <SelectField label="Currency" name="revenue-currency" options={(data?.currencies || [currency]).map(value => ({ value, label: value }))} value={currency} onChange={change(setCurrency)} />
      <SelectField label="Sales" name="revenue-mode" value={mode} onChange={change(setMode)} options={[{ value: "live", label: "Live payments" }, { value: "test", label: "Test payments" }, { value: "all", label: "All payments" }, ...(admin ? [{ value: "unknown", label: "Unknown payment mode" }] : [])]} />
      {admin && <SelectField label="Instructor" name="revenue-instructor" options={ownerOptions} value={instructor?.id || "all"} loading={!instructorsQuery.currentData && instructorsQuery.isFetching} error={instructorsQuery.isError ? userMessage(instructorsQuery.error) : undefined} onChange={id => { const owner = owners.find(owner => owner.id === id); setInstructor(owner || null); setPage(1); }} />}
      <SelectField label="Sales month (India time)" name="revenue-period" value={period || "all"} options={salesMonthOptions()} onChange={value => { setPeriod(value === "all" ? "" : value); setDateRange({ fromDate: "", toDate: "" }); setPage(1); }} />
      <DateRangePicker label="Custom dates" {...dateRange} maxDate={businessDate()} onChange={value => { setDateRange(value); setPeriod(""); setPage(1); }} />
      {admin && (instructorsQuery.currentData?.hasNextPage || instructorSearch) && <label className="revenue-field">Find an instructor<input name="revenue-instructor-search" value={instructorSearch} onChange={event => setInstructorSearch(event.target.value)} placeholder="Search by name" /><span className="revenue-note">Refine the name to find more instructors.</span></label>}
    </div></section>
    {(period || dateRange.fromDate || status !== "all" || instructor) && <div className="revenue-filter-summary"><p className="revenue-note">{dateRange.fromDate ? `${dateRange.fromDate} to ${dateRange.toDate} (India time)` : period ? `Sales month: ${period}` : "All sales periods"}{instructor ? ` · ${instructor.name}` : ""}</p><button type="button" className="cw-button cw-button-compact" onClick={() => { setPeriod(""); setDateRange({ fromDate: "", toDate: "" }); setInstructor(null); setStatus("all"); setPage(1); }}>Clear filters</button></div>}
    {mode === "live" && data?.totals.sales === 0 && data?.availableModes?.test > 0 && <div className="revenue-notice revenue-row"><p>This view shows live payments. You have {data.availableModes.test} test {data.availableModes.test === 1 ? "sale" : "sales"} available to view.</p><button type="button" className="cw-button" onClick={() => change(setMode)("test")}>View test earnings</button></div>}
    {admin && instructor && <div className="revenue-row revenue-notice"><p>Viewing {instructor.name}</p><div className="revenue-row"><button className="cw-button" onClick={() => { setInstructor(null); setPage(1); }}>All instructors</button>{mode === "live" && <button className="cw-button" disabled={!data || summary.isFetching} onClick={() => setDialog({ type: "payout", salesPeriod: period || undefined, row: { ...instructor, balance: data?.balance }, currency, exponent: data?.currencyExponent ?? 2 })}>Prepare payout</button>}</div></div>}
    {mode !== "live" && <p className="revenue-notice">{mode === "test" ? "Test transactions are for verification only and cannot be paid out." : "This report includes payments that may not be eligible for payout."} The balances above always show live earnings across all months.</p>}
    {period && mode === "live" && (!admin || instructor) && <section className="studio-panel revenue-panel"><h2>Monthly statement · {period}</h2><QueryMessage query={{ loading: monthly.isFetching, error: monthly.error, refresh: monthly.refetch }} label="Checking monthly payout" compact />{monthly.currentData && !monthly.isError && <><dl className="revenue-totals"><div><dt>Month’s earnings</dt><dd>{format(monthly.currentData.periodEarningsMinor)}</dd></div><div><dt>Earlier adjustments</dt><dd>{format(monthly.currentData.adjustmentMinor)}</dd></div><div><dt>Scheduled payout</dt><dd>{dateText(monthly.currentData.scheduledAt)}</dd></div></dl>{monthly.currentData.reasons?.map(reason => <p className="revenue-note" key={reason}>{reason}</p>)}</>}</section>}
    {view === "summary" && !tableUsesSummary && <QueryMessage query={{ loading: !data && !summary.isError, error: summary.error, data, refresh: summary.refetch }} label="Loading earnings totals" />}
    {view === "summary" && data && <section className="studio-panel revenue-panel revenue-overview" aria-label="Earnings overview"><h2>Earnings overview</h2>
        <dl className="revenue-totals">{[["Verified sales", data.totals.sales], ["Gross sales", format(data.totals.grossMinor)], ["Refunds", format(data.totals.refundedMinor)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <RevenueCalculation totals={data.totals} currency={currency} exponent={data?.currencyExponent ?? 2} mode={mode} admin={admin} />
        {(data.totals.reviewPending > 0 || data.totals.feePending > 0) && <p className="revenue-note">{data.totals.reviewPending} sale(s) have payment exceptions. {data.totals.feePending > 0 && `${data.totals.feePending} gateway fee(s) not yet verified.`} Unresolved sales are excluded from earnings until verified.</p>}
    </section>}
    <section className="studio-panel revenue-panel" aria-label={view === "summary" ? admin && !instructor ? "Sales by instructor" : "Sales by course" : undefined} aria-busy={content.isFetching}>
      {view === "summary" && <div className="revenue-report-heading revenue-table-heading"><div><h2>{admin && !instructor ? "Sales by instructor" : "Sales by course"}</h2>{canSortSummary && <p className="revenue-note">Change the order of the rows below.</p>}</div>{canSortSummary && <SelectField label={admin && !instructor ? "Sort instructors" : "Sort courses"} name="revenue-sort" value={sort} options={sortOptions} onChange={change(setSort)} />}</div>}
      <QueryMessage query={{ loading: !report && !content.isError, error: content.error, data: report, refresh }} label="Loading revenue report" compact />
      {report && <>

      {view === "summary" ? <>
        {!report.groups.length ? <p className="analytics-empty">No sales match these filters. Your verified course payments will appear here.</p> : <div className="revenue-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">{report.groupBy === "instructor" ? "Instructor" : "Course"}</th><th scope="col">Sales</th><th scope="col">Gross sales</th><th scope="col">Earnings</th>{admin && report.groupBy === "instructor" && <th scope="col">Payout</th>}</tr></thead><tbody>{report.groups.map(row => <tr key={row.id || "unattributed"}><th scope="row">{admin && report.groupBy === "instructor" && row.id ? <button className="cw-text-link" onClick={() => { setInstructor({ id: row.id, name: row.name }); setPage(1); }}>{row.name}</button> : row.name}</th><td data-label="Sales">{row.sales}</td><td data-label="Gross sales">{format(row.grossMinor)}</td><td data-label="Earnings">{format(row.earnedMinor)}</td>{admin && report.groupBy === "instructor" && <td data-label="Live available">{!row.id ? "Instructor missing" : mode === "test" ? "Test sales cannot be paid out" : mode !== "live" ? "Select live payments to prepare payouts" : <><span>{format(row.balance?.availableMinor ?? 0)}</span><button type="button" className="cw-button" disabled={!data || summary.isFetching} onClick={() => setDialog({ type: "payout", salesPeriod: period || undefined, row, currency, exponent: data?.currencyExponent ?? 2 })}>Prepare payout</button></>}</td>}</tr>)}</tbody></table></div>}
      </> : view === "sales" ? <>
        <div className="revenue-report-heading"><h2>Sales ledger</h2><div className="revenue-ledger-controls"><SelectField label="Payment status" name="revenue-status" value={status} onChange={change(setStatus)} options={[{ value: "all", label: "All statuses" }, { value: "paid", label: "Paid" }, { value: "refunded", label: "Refunded" }, { value: "disputed", label: "Disputed" }, { value: "review_required", label: "Payment exception" }]} /><SelectField label="Sort by" name="revenue-sort" value={sort} options={sortOptions} onChange={change(setSort)} /></div></div><p className="revenue-note">GST and earnings update automatically from confirmed sales. Disputed or incomplete payments are flagged below.</p>
        {!report.items.length ? <p className="analytics-empty">No sales match these filters.</p> : <div className="revenue-table-scroll"><table className="analytics-table"><thead><tr><th scope="col">Course / sale date</th><th scope="col">Payment</th><th scope="col">Earnings</th><th scope="col">Details</th></tr></thead><tbody>{report.items.map(sale => <tr key={sale.id}><th scope="row">{sale.courseTitle}<small>{dateText(sale.earnedAt)}{admin && ` · ${sale.instructorName}`}</small></th><td data-label="Payment">{format(sale.grossMinor)}<small>{sale.mode} · {sale.status.replaceAll("_", " ")}</small>{sale.refundedMinor > 0 && <small>Refunded {format(sale.refundedMinor)}</small>}</td><td data-label="Earnings">{format(sale.earnedMinor)}<small>{sale.reviewReasons.length ? sale.reviewReasons.join("; ") : `Hold ends ${dateText(sale.availableAt)}`}</small></td><td data-label="Details"><button className="cw-button" onClick={() => setDialog({ type: "sale", id: sale.id })}>View details</button></td></tr>)}</tbody></table></div>}
      </> : <>
        <div className="revenue-report-heading"><h2>Monthly payout history</h2><SelectField label="Sort by" name="revenue-sort" value={sort} options={sortOptions} onChange={change(setSort)} /></div><p className="revenue-note">Each payout covers one complete sales month in India time, after its 30-day hold. Later refunds or fee changes appear as adjustments to a following statement. Transfers are made outside QuranScholar; a paid status records a confirmed bank transfer.</p>
        {!report.items.length ? <p className="analytics-empty">No payouts recorded for this currency and reporting period.</p> : <div className="revenue-payouts">{report.items.map(payout => <article key={payout.id} className="revenue-payout"><div className="revenue-row"><div><h3>{admin ? payout.instructorName : `Payout · ${payout.period}`}</h3><p>{payout.period} · {dateText(payout.createdAt)}</p></div><span className="cw-publication-status revenue-status" data-status={payout.status}>{payout.status}</span></div>{payout.accountingVersion && <p>Sales month: {payout.period} (India time). Scheduled payout: {dateText(payout.scheduledAt)}.</p>}<dl className="revenue-totals">{Number.isSafeInteger(payout.periodEarningsMinor) && <div><dt>Monthly earnings</dt><dd>{format(payout.periodEarningsMinor)}</dd></div>}{Number.isSafeInteger(payout.adjustmentMinor) && payout.adjustmentMinor !== 0 && <div><dt>Earlier adjustments</dt><dd>{format(payout.adjustmentMinor)}</dd></div>}<div><dt>Gross payout</dt><dd>{format(payout.amountMinor)}</dd></div><div><dt>Withholding</dt><dd>{format(payout.withholdingMinor)}</dd></div><div><dt>Net transfer</dt><dd>{format(payout.transferMinor)}</dd></div></dl>{payout.beneficiaryLabel && <p>Beneficiary: {payout.beneficiaryLabel}</p>}{payout.transferReference && <p>Transfer reference: {payout.transferReference} · {dateText(payout.paidAt)}</p>}<details><summary>Activity history</summary><ol className="revenue-history">{payout.events.map((event, index) => <li key={index}><strong>{event.action}</strong> · {dateText(event.at)}{event.note && <p>{event.note}</p>}</li>)}</ol></details>{admin && <div className="revenue-row">{payoutActions(payout.status).map(action => <button className="cw-button" key={action} onClick={() => setDialog({ type: "payoutAction", payout, action })}>{labels[action]}</button>)}</div>}</article>)}</div>}
      </>}
      <Pagination pagination={report.pagination} page={page} onPage={setPage} loading={content.isFetching} />
      </>}
    </section>
    {admin && <details className="studio-panel revenue-maintenance"><summary>Payment maintenance{data?.unrecorded > 0 && <span>{data.unrecorded} missing revenue record(s)</span>}<ChevronDown size={16} aria-hidden="true" /></summary><section className="revenue-sync"><div><h2>Reconcile verified payments</h2><p>Use this only when existing sales, fees, or refunds need updating from Razorpay. New sales update automatically. Batches continue while this page is open.</p></div><AsyncButton className="cw-button" loading={syncing || mutation.isLoading} loadingLabel="Reconciling" onClick={sync}>{syncState?.hasNextPage ? "Resume reconciliation" : "Reconcile payments"}</AsyncButton>{syncing && <button type="button" className="cw-button" onClick={() => { syncRun.current = null; setSyncing(false); }}>Pause reconciliation</button>}{syncState && <p role="status">{syncState.error || `${syncState.total} payment(s) checked; ${syncState.failures} need attention. ${syncState.hasNextPage ? syncing ? "Continuing automatically…" : "Paused. Resume to continue." : "Reconciliation complete."}`}</p>}</section></details>}
    {dialog && <RevenueDialogs key={`${dialog.type}-${dialog.id || dialog.payout?.id || dialog.row?.id}-${dialog.action || ""}`} dialog={dialog} admin={admin} onClose={() => setDialog(null)} />}
  </WorkspacePage>;
}
