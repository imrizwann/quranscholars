import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import paymentApi, { useCreateCourseCheckoutMutation, useVerifyCourseCheckoutMutation, useReconcileCoursePaymentMutation, useGetCourseAccessQuery, useGetCoursePaymentStatusQuery } from "@/services/api/user/paymentApi.js";
import { useEnrollFreeCourseMutation } from "@/services/api/user/learnerApi.js";
import { checkoutAttempt, clearCheckout, hostedCheckoutUrl, readCheckout, saveCheckout } from "@/features/payments/checkout-session.js";
import { userMessage } from "@/lib/user-messages.js";
import { enrollmentFailureMessage } from "@/features/payments/enrollment-feedback.js";
import { openRazorpayCheckout } from "@/features/payments/razorpay-checkout.js";

const awaitingConfirmation = "We could not confirm your payment yet. Check payment status again shortly; do not make another payment.";

export default function CourseEnrollment({ course }) {
  const user = useSelector(state => state.user.user);
  const location = useLocation();
  if (!user?._id && course.enrollmentOpen === false) return <p className="cd-enrollment-feedback" role="status">Enrollment is currently closed. Existing learners can continue from My learning.</p>;
  if (!user?._id) return <><Link className="cw-button cw-primary cd-enrollment-action" to="/login" state={{ from: `/courses/${encodeURIComponent(course.slug)}${location.search}` }}>Sign in to enroll<ArrowRight size={16} /></Link><p className="cd-enrollment-note">Use your account to enroll and keep your learning in one place.</p></>;
  return <EnrollmentAction key={`${user._id}/${course.id}`} course={course} user={user} />;
}

function EnrollmentAction({ course, user }) {
  const dispatch = useDispatch();
  const access = useGetCourseAccessQuery(course.id, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const [enroll, enrolling] = useEnrollFreeCourseMutation();
  const [checkout, paying] = useCreateCourseCheckoutMutation();
  const [verify, verifying] = useVerifyCourseCheckoutMutation();
  const [reconcile, reconciling] = useReconcileCoursePaymentMutation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const gateway = useRef(null);
  const [intentId, setIntentId] = useState(() => readCheckout(user._id, course.id)?.intentId || null);
  const restoredIntent = useRef(intentId);
  const awaitingAccess = useRef(false);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(true);
  const [pollRevision, setPollRevision] = useState(0);
  const lock = useRef(false), mounted = useRef(true);
  const status = useGetCoursePaymentStatusQuery(intentId, {
    skip: !intentId, pollingInterval: polling ? 5000 : 0, refetchOnFocus: true, refetchOnReconnect: true,
  });
  const payment = status.currentData || latest;
  const free = course.price.current === 0;
  const active = access.currentData?.canAccessCourse === true && !access.error;
  const busy = enrolling.isLoading || paying.isLoading || verifying.isLoading || reconciling.isLoading || checkoutOpen;
  const enrollmentOpen = access.currentData?.enrollmentOpen ?? course.enrollmentOpen;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; gateway.current?.close(); }; }, []);
  const rememberPayment = useCallback(async confirmed => {
    if (!mounted.current) return;
    setLatest(confirmed);
    await dispatch(paymentApi.util.upsertQueryData("getCoursePaymentStatus", confirmed.intentId, confirmed));
  }, [dispatch]);
  const recoverPayment = useCallback(async id => {
    const confirmed = await reconcile({ intentId: id }).unwrap();
    await rememberPayment(confirmed);
  }, [reconcile, rememberPayment]);
  useEffect(() => {
    if (!intentId || restoredIntent.current !== intentId || payment?.state !== "pending") return;
    restoredIntent.current = null;
    awaitingAccess.current = true;
    recoverPayment(intentId).catch(() => { if (mounted.current) setError(awaitingConfirmation); });
  }, [intentId, payment?.state, recoverPayment]);
  useEffect(() => {
    if (!active || !awaitingAccess.current) return;
    awaitingAccess.current = false;
    toast.success("Your course is ready", {
      id: `course-access:${user._id}:${course.id}`,
      description: "You can start learning now or find this course in My learning.",
    });
  }, [active, user._id, course.id]);
  useEffect(() => {
    if (status.error?.status === 410) {
      clearCheckout(user._id, course.id); setIntentId(null); setLatest(null); setPolling(false);
    }
  }, [status.error, user._id, course.id]);
  useEffect(() => {
    if (!intentId || (payment?.state && payment.state !== "pending")) { setPolling(false); return; }
    setPolling(true);
    const timer = setTimeout(() => setPolling(false), 120000);
    return () => clearTimeout(timer);
  }, [intentId, payment?.state, pollRevision]);
  useEffect(() => {
    if (payment?.state && payment.state !== "pending") {
      dispatch(paymentApi.util.invalidateTags([{ type: "CourseAccess", id: course.id }, "LearningLibrary"]));
    }
  }, [payment?.state, course.id, dispatch]);

  async function join() {
    if (lock.current || active) return;
    lock.current = true; setError("");
    try {
      if (free && !intentId) {
        await enroll({ courseId: course.id }).unwrap();
      } else {
        awaitingAccess.current = true;
        const attempt = checkoutAttempt(user._id, course.id, payment);
        if (!attempt.intentId) { setLatest(null); setIntentId(null); }
        const result = await checkout({ courseId: course.id, idempotencyKey: attempt.idempotencyKey }).unwrap();
        if (!mounted.current) return;
        saveCheckout(user._id, course.id, { ...attempt, intentId: result.intentId });
        setLatest(result); setIntentId(result.intentId);
        if (result.state === "pending") {
          if (result.checkout?.provider === "razorpay") {
            setCheckoutOpen(true);
            const response = await openRazorpayCheckout({ payment: result, course, user, onInstance: instance => { if (!mounted.current) return false; gateway.current = instance; } });
            gateway.current = null;
            if (!mounted.current) return;
            setCheckoutOpen(false);
            if (response) {
              try {
                const confirmed = await verify({ intentId: result.intentId, ...response }).unwrap();
                if (!mounted.current) return;
                await rememberPayment(confirmed);
              } catch {
                try { await recoverPayment(result.intentId); }
                catch { if (mounted.current) setError(awaitingConfirmation); }
              }
            } else {
              try { await recoverPayment(result.intentId); }
              catch { if (mounted.current) setError(awaitingConfirmation); }
            }
            setPollRevision(revision => revision + 1);
          } else {
            const destination = hostedCheckoutUrl(result.checkout);
            if (destination) window.location.assign(destination);
            else setError("Online payment is not available for this checkout yet. Please contact our team; your course access has not changed.");
          }
        }
      }
      if (mounted.current) await access.refetch();
    } catch (failure) {
      if (mounted.current) {
        if (failure?.status === 410) { clearCheckout(user._id, course.id); setIntentId(null); setLatest(null); setPolling(false); }
        setError(enrollmentFailureMessage(failure));
      }
    } finally { lock.current = false; if (mounted.current) setCheckoutOpen(false); }
  }

  if (active) return <><p className="cd-enrollment-status" role="status"><CheckCircle2 size={17} />You have access to this course</p><Link className="cw-button cw-primary cd-enrollment-action" to={`/learn/${encodeURIComponent(course.slug)}`}>Start learning<ArrowRight size={16} /></Link><Link className="cd-preview-link" to="/dashboard/learning">My learning</Link></>;
  if (access.isLoading || (!access.currentData && access.isFetching)) return <LoadingState variant="inline" label="Checking course access" />;
  if (access.error) return <div className="cd-enrollment-feedback" role="alert"><p>{userMessage(access.error)}</p><AsyncButton className="cw-button" loading={access.isFetching} loadingLabel="Checking access" onClick={access.refetch}>Check access again</AsyncButton></div>;
  if (user.role === "instructor" && String(course.instructor.id) === String(user._id)) return <Link className="cw-button cw-primary cd-enrollment-action" to={`/instructor/courses/${course.id}`}>Open course studio<ArrowRight size={16} /></Link>;
  if (enrollmentOpen === false && (!intentId || ["failed", "refunded", "disputed"].includes(payment?.state))) return <p className="cd-enrollment-feedback" role="status">Enrollment is currently closed. Existing learners can continue from My learning.</p>;
  if (!free && !intentId && access.currentData?.checkoutAvailable !== true) return <p className="cd-enrollment-feedback" role="status">Online purchases are not available yet. <Link to="/contact">Contact our team</Link> for help with this course.</p>;
  return <div>
    {payment?.state === "paid" ? <><p className="cd-enrollment-status" role="status">Payment confirmed. Checking your course access.</p><AsyncButton className="cw-button" loading={access.isFetching} loadingLabel="Checking access" onClick={access.refetch}>Check course access</AsyncButton></> : payment?.state === "review_required" ? <p className="cd-enrollment-feedback" role="status">Your payment needs review. Please <Link to="/contact">contact our team</Link> before paying again.</p> : <>
      {payment?.state === "pending" && <div className="cd-checkout-summary">
        <div><ShieldCheck size={19} aria-hidden="true" /><strong>Secure checkout</strong></div>
        <p>{course.title}</p>
        <dl><dt>Order total</dt><dd>{new Intl.NumberFormat(undefined, { style: "currency", currency: payment.currency }).format(payment.amountMinor / 10 ** ({ JPY: 0, KWD: 3 }[payment.currency] ?? 2))}</dd></dl>
        {payment.testMode && <p>Test mode. No real money will be charged.</p>}
        <p role="status">{verifying.isLoading ? "Confirming your payment…" : checkoutOpen ? "Complete your payment in the secure checkout window." : "If you have already paid, check payment status before continuing."}</p>
      </div>}
      {["failed", "refunded", "disputed"].includes(payment?.state) && <p className="cd-enrollment-note" role="status">{payment.state === "failed" ? "The payment was not completed." : "This payment no longer provides course access."}</p>}
      <AsyncButton className="cw-button cw-primary cd-enrollment-action" loading={busy} loadingLabel={verifying.isLoading || reconciling.isLoading ? "Confirming payment" : checkoutOpen ? "Checkout open" : free && !intentId ? "Enrolling" : "Preparing checkout"} disabled={Boolean(intentId && status.isLoading) || access.isFetching} onClick={join}>{payment?.state === "pending" ? "Continue payment" : free && !intentId ? "Enroll for free" : "Buy course"}<ArrowRight size={16} /></AsyncButton>
      <p className="cd-enrollment-note">{free && !intentId ? "Join now and learn at your own pace." : "Course access starts after payment is confirmed."}</p>
    </>}
    {intentId && !active && <AsyncButton className="cw-button cd-payment-check" loading={status.isFetching || reconciling.isLoading} disabled={paying.isLoading || verifying.isLoading || checkoutOpen} loadingLabel="Checking payment" onClick={() => {
      setError("");
      if (payment?.state === "pending") recoverPayment(intentId).catch(() => { if (mounted.current) setError(awaitingConfirmation); });
      else status.refetch();
    }}>Check payment status</AsyncButton>}
    {(error || status.error) && <p className="cd-enrollment-feedback" role="alert">{error || "We could not check your payment. Try again; do not start a second payment."}</p>}
    {intentId && <p className="cd-checkout-reference">Payment reference: {intentId}</p>}
  </div>;
}
