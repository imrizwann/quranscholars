import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import paymentApi, { useCreateCourseCheckoutMutation, useGetCourseAccessQuery, useGetCoursePaymentStatusQuery } from "@/services/api/user/paymentApi.js";
import { useEnrollFreeCourseMutation } from "@/services/api/user/learnerApi.js";
import { checkoutAttempt, hostedCheckoutUrl, readCheckout, saveCheckout } from "@/features/payments/checkout-session.js";
import { userMessage } from "@/lib/user-messages.js";

export default function CourseEnrollment({ course }) {
  const user = useSelector(state => state.user.user);
  const location = useLocation();
  if (!user?._id) return <><Link className="cw-button cw-primary cd-enrollment-action" to="/login" state={{ from: `/courses/${encodeURIComponent(course.slug)}${location.search}` }}>Sign in to enroll<ArrowRight size={16} /></Link><p className="cd-enrollment-note">Use your account to join this course. No additional admission form is needed.</p></>;
  return <EnrollmentAction key={`${user._id}/${course.id}`} course={course} user={user} />;
}

function EnrollmentAction({ course, user }) {
  const dispatch = useDispatch();
  const access = useGetCourseAccessQuery(course.id, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const [enroll, enrolling] = useEnrollFreeCourseMutation();
  const [checkout, paying] = useCreateCourseCheckoutMutation();
  const [intentId, setIntentId] = useState(() => readCheckout(user._id, course.id)?.intentId || null);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(true);
  const lock = useRef(false), mounted = useRef(true);
  const status = useGetCoursePaymentStatusQuery(intentId, {
    skip: !intentId, pollingInterval: polling ? 5000 : 0, refetchOnFocus: true, refetchOnReconnect: true,
  });
  const payment = status.currentData || latest;
  const free = course.price.current === 0;
  const mockCheckout = access.currentData?.mockCheckoutAvailable === true;
  const active = access.currentData?.canAccessCourse === true && !access.error;
  const busy = enrolling.isLoading || paying.isLoading;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!intentId || (payment?.state && payment.state !== "pending")) { setPolling(false); return; }
    setPolling(true);
    const timer = setTimeout(() => setPolling(false), 120000);
    return () => clearTimeout(timer);
  }, [intentId, payment?.state]);
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
        const attempt = checkoutAttempt(user._id, course.id, payment);
        if (!attempt.intentId) { setLatest(null); setIntentId(null); }
        const result = await checkout({ courseId: course.id, idempotencyKey: attempt.idempotencyKey }).unwrap();
        if (!mounted.current) return;
        saveCheckout(user._id, course.id, { ...attempt, intentId: result.intentId });
        setLatest(result); setIntentId(result.intentId);
        if (result.state === "pending") {
          const destination = hostedCheckoutUrl(result.checkout);
          if (destination) window.location.assign(destination);
          else setError("Online payment is not available for this checkout yet. Please contact our team; your course access has not changed.");
        }
      }
      if (mounted.current) await access.refetch();
    } catch (failure) {
      if (mounted.current) setError(failure?.status === 404 ? "This course is not open for enrollment yet." : failure?.status === 503 ? "Enrollment is temporarily unavailable. Please try again later. If you already started payment, retry here to resume the same checkout." : userMessage(failure));
    } finally { lock.current = false; }
  }

  if (active) return <><p className="cd-enrollment-status" role="status"><CheckCircle2 size={17} />You have access to this course</p>{mockCheckout && !free && <p className="cd-enrollment-note">Test payments are enabled. Simulated purchases do not charge money.</p>}<Link className="cw-button cw-primary cd-enrollment-action" to={`/learn/${encodeURIComponent(course.slug)}`}>Start learning<ArrowRight size={16} /></Link><Link className="cd-preview-link" to="/dashboard/learning">My learning</Link></>;
  if (access.isLoading || (!access.currentData && access.isFetching)) return <LoadingState variant="inline" label="Checking course access" />;
  if (access.error) return <div className="cd-enrollment-feedback" role="alert"><p>{userMessage(access.error)}</p><AsyncButton className="cw-button" loading={access.isFetching} loadingLabel="Checking access" onClick={access.refetch}>Check access again</AsyncButton></div>;
  if (user.role === "instructor" && String(course.instructor.id) === String(user._id)) return <Link className="cw-button cw-primary cd-enrollment-action" to={`/instructor/courses/${course.id}`}>Open course studio<ArrowRight size={16} /></Link>;
  return <div>
    {mockCheckout && !free && <p className="cd-enrollment-feedback" role="status"><strong>Test purchase</strong><br />No payment will be charged. This enrollment is for testing.</p>}
    {payment?.state === "paid" ? <><p className="cd-enrollment-status" role="status">{payment.isMockPayment ? mockCheckout ? "Test purchase completed. Checking your course access." : "Test payments are disabled. This simulated purchase no longer grants course access." : "Payment confirmed. Checking your course access."}</p><AsyncButton className="cw-button" loading={access.isFetching} loadingLabel="Checking access" onClick={access.refetch}>Check course access</AsyncButton></> : payment?.state === "review_required" ? <p className="cd-enrollment-feedback" role="status">Your payment needs review. Please <Link to="/contact">contact our team</Link> before paying again.</p> : <>
      {payment?.state === "pending" && <p className="cd-enrollment-note" role="status">Your payment is awaiting confirmation. If you have already paid, check its status before continuing.</p>}
      {["failed", "refunded", "disputed"].includes(payment?.state) && <p className="cd-enrollment-note" role="status">{payment.state === "failed" ? "The payment was not completed." : "This payment no longer provides course access."}</p>}
      <AsyncButton className="cw-button cw-primary cd-enrollment-action" loading={busy} loadingLabel={free && !intentId ? "Enrolling" : mockCheckout ? "Completing test purchase" : "Preparing checkout"} disabled={Boolean(intentId && status.isLoading) || access.isFetching} onClick={join}>{payment?.state === "pending" ? "Continue payment" : free && !intentId ? "Enroll for free" : mockCheckout ? "Complete test purchase" : "Buy course"}<ArrowRight size={16} /></AsyncButton>
      <p className="cd-enrollment-note">{free && !intentId ? "Join now and learn at your own pace." : mockCheckout ? "Your test course will appear in My learning after enrollment." : "Course access starts after payment is confirmed."}</p>
    </>}
    {intentId && !active && <AsyncButton className="cw-button cd-payment-check" loading={status.isFetching} loadingLabel="Checking payment" onClick={() => status.refetch()}>Check payment status</AsyncButton>}
    {(error || status.error) && <p className="cd-enrollment-feedback" role="alert">{error || "We could not check your payment. Try again; do not start a second payment."}</p>}
    {intentId && <p className="cd-checkout-reference">Payment reference: {intentId}</p>}
  </div>;
}
