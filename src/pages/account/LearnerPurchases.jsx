import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Copy, ReceiptText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  WorkspaceEmpty,
  WorkspacePage,
} from "@/components/lms/WorkspaceUI.jsx";
import {
  Pagination,
  QueryMessage,
} from "@/features/instructor-courses/WorkspaceParts.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { useGetPurchaseHistoryQuery } from "@/services/api/user/paymentApi.js";
import { formatMoney } from "@/lib/money.js";
import "./learner-purchases.css";

const statuses = {
  paid: ["Paid", "Your payment is confirmed. Find your course in My learning."],
  pending: [
    "Pending confirmation",
    "Confirmation is still pending. Check here again before making another payment.",
  ],
  failed: [
    "Not completed",
    "This payment was not completed. Contact our team if you were charged.",
  ],
  refunded: [
    "Refund recorded",
    "A refund has been recorded for this payment. Contact our team for refund details.",
  ],
  disputed: [
    "Under review",
    "This payment is being reviewed. Contact our team if you need help.",
  ],
  review_required: [
    "Access needs review",
    "Payment was received, but course access needs review. Contact our team before paying again.",
  ],
};
const queryOptions = {
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
};
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

// A reference people may need to quote to support, with a copy button.
function Reference({ value, fallback, label }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="purchase-muted">{fallback}</span>;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${label}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy is not available", { description: "Select the reference and copy it manually." });
    }
  };
  return <span className="purchase-reference-row">
    <code className="purchase-reference">{value}</code>
    <button type="button" className="purchase-copy" onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}<span className="sr-only">Copy</span>
    </button>
  </span>;
}

function PurchaseHistory({ authenticated }) {
  const [cursors, setCursors] = useState([null]),
    [index, setIndex] = useState(0);
  const query = useGetPurchaseHistoryQuery(
    { ...(cursors[index] && { before: cursors[index] }), limit: 10 },
    { ...queryOptions, skip: !authenticated },
  );
  const data = query.isError ? null : query.currentData;
  const refresh = () => {
    if (index) {
      setCursors([null]);
      setIndex(0);
    } else query.refetch();
  };
  const changePage = (page) => {
    if (page === index + 2 && data?.pagination.nextCursor) {
      setCursors((previous) => [
        ...previous.slice(0, index + 1),
        data.pagination.nextCursor,
      ]);
      setIndex(index + 1);
    } else if (page === index && index > 0) setIndex(index - 1);
  };
  return (
    <WorkspacePage
      eyebrow="Learner workspace"
      title="Purchases"
      description="Your course orders, payment references, and payment status in one place."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <AsyncButton
            className="cw-button"
            loading={query.isFetching}
            loadingLabel="Updating"
            disabled={!authenticated}
            onClick={refresh}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </AsyncButton>
        </div>
      }
    >
      <QueryMessage
        query={{
          error: query.error,
          loading: authenticated && !data && !query.isError,
          data,
          refresh,
        }}
        label="Loading your purchases"
      />
      {data && (
        <section
          className="purchase-history"
          aria-label="Your purchase history"
          aria-busy={query.isFetching}
        >
          {!data.items.length ? (
            index > 0 ? (
              <section className="studio-panel">
                <h2>No more orders on this page</h2>
                <p className="purchase-note">
                  Go back to see your earlier results, or refresh for the latest
                  orders.
                </p>
              </section>
            ) : (
              <div className="purchase-empty">
                <WorkspaceEmpty
                  icon={ReceiptText}
                  title="Your purchases will appear here"
                  description="You haven’t started a course purchase yet. Free enrollments are available in My learning."
                  to="/courses"
                  action="Explore courses"
                />
              </div>
            )
          ) : (
            <>
              <p className="purchase-note">
                Newest orders first. Amounts show the original order total;
                refund and review statuses are shown separately.
              </p>
              <div className="purchase-list">
                {data.items.map((order) => {
                  const [label, description] = statuses[order.status] || [
                    "Status unavailable",
                    "Refresh to check this payment’s latest status.",
                  ];
                  const date = new Date(order.orderedAt),
                    validDate = Number.isFinite(date.getTime());
                  return (
                    <article
                      className="studio-panel purchase-card"
                      key={order.id}
                      aria-label={`Order for ${order.course.title}`}
                    >
                      <div className="purchase-card-heading">
                        <span className="purchase-icon" aria-hidden="true"><ReceiptText size={20} /></span>
                        <div className="purchase-title">
                          <h2>{order.course.title}</h2>
                          <div className="purchase-badges">
                            <span className="purchase-status" data-status={order.status}>{label}</span>
                            {order.testMode && <span className="purchase-test">Test payment</span>}
                          </div>
                        </div>
                        <dl className="purchase-total">
                          <dt>Order amount</dt>
                          <dd className="purchase-amount">{formatMoney(order.amountMinor, order.currency, order.currencyExponent)}</dd>
                        </dl>
                      </div>
                      <dl className="purchase-details">
                        <div>
                          <dt>Ordered on</dt>
                          <dd>{validDate ? <time dateTime={date.toISOString()}>{dateFormatter.format(date)}</time> : "Date unavailable"}</dd>
                        </div>
                        <div>
                          <dt>Order reference</dt>
                          <dd><Reference value={order.orderReference} fallback="Awaiting confirmation" label="order reference" /></dd>
                        </div>
                        <div>
                          <dt>Payment reference</dt>
                          <dd><Reference value={order.paymentReference} fallback="Not available yet" label="payment reference" /></dd>
                        </div>
                      </dl>
                      <div className="purchase-card-footer">
                        <p>
                          {description}
                          {order.testMode && " This is a test transaction; no real payment was collected."}
                        </p>
                        {order.course.slug && (
                          <Link className="cw-text-link" to={`/courses/${encodeURIComponent(order.course.slug)}`}>
                            Course details <ArrowUpRight size={15} aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
          <Pagination
            pagination={data.pagination}
            page={index + 1}
            onPage={changePage}
            loading={query.isFetching}
          />
          <p className="purchase-help">
            Need help with a payment?{" "}
            <Link to="/contact" className="cw-text-link">
              Contact our team
            </Link>{" "}
            and include your payment or order reference.
          </p>
        </section>
      )}
    </WorkspacePage>
  );
}
export default function LearnerPurchases() {
  const user = useSelector((state) => state.user?.user);
  return (
    <PurchaseHistory
      key={`${user?._id}:${user?.role}`}
      authenticated={Boolean(user?._id)}
    />
  );
}
