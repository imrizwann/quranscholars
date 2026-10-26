import { userMessage } from "@/lib/user-messages.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetMyAdmissionQuery,
  useJoinMutation,
  useUpdateMutation,
} from "@/services/api/user/admissionApis.js";
import { useGetCoursesQuery } from "@/services/api/courses/courses.api.js";
import { toast, Toaster } from "sonner";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  LockKeyhole,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import DobPicker from "@/hooks/useDobPicker.jsx";

const countryOptions = [
  "United States",
  "United Kingdom",
  "Canada",
  "Saudi Arabia",
  "United Arab Emirates",
  "Pakistan",
  "India",
  "Bangladesh",
  "Malaysia",
  "Qatar",
  "Other",
];

const admissionSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string(),
  contactNumber: z.string().min(8, "Contact number required"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth is required"),
  address: z.string().min(5, "Address is required"),
  zipCode: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  selectedCourses: z
    .array(z.string())
    .min(1, "Select at least one course")
    .refine(
      (value) => new Set(value).size === value.length,
      "Duplicate courses",
    ),
  notes: z.string().max(500, "Keep notes under 500 characters").optional(),
});

const normalizeDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const inputClassName =
  "mt-2 h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/15 read-only:cursor-not-allowed read-only:bg-muted read-only:text-muted-foreground";
const labelClassName = "text-sm font-bold text-foreground";
const errorClassName = "mt-1.5 text-xs font-semibold text-destructive";
const helperClassName = "mt-1.5 text-xs leading-5 text-muted-foreground";

const statusTone = {
  pending: "border-[#e4c77d]/30 bg-[#e4c77d]/10 text-[#f0d995]",
  "in-review": "border-sky-200/25 bg-sky-200/10 text-sky-200",
  accepted: "border-emerald-200/25 bg-emerald-200/10 text-emerald-200",
  rejected: "border-red-300/30 bg-red-300/10 text-red-200",
  "not submitted": "border-white/15 bg-white/10 text-white/90",
};

const formatStatus = (value) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-4 border-b border-border px-5 py-5 sm:px-7">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-5" />
    </span>
    <div>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Admission = () => {
  const [showForm, setShowForm] = useState(false);
  const formSectionRef = useRef(null);
  const { user } = useSelector((state) => state.user);
  const { data } = useGetCoursesQuery();
  const courses = data?.data || [];
  const { data: admission, isFetching: isAdmissionLoading } =
    useGetMyAdmissionQuery(user?._id, {
      skip: !user?._id,
      refetchOnMountOrArgChange: true,
    });
  const [join, { isLoading: isJoining }] = useJoinMutation();
  const [update, { isLoading: isUpdating }] = useUpdateMutation();
  const hasExistingAdmission = Boolean(admission?._id);

  const defaultValues = useMemo(
    () => ({
      fullName: admission?.fullName || "",
      email: user?.email || "",
      contactNumber: admission?.contactNumber || "",
      dob: normalizeDate(admission?.dob),
      address: admission?.address || "",
      zipCode: admission?.zipCode || "",
      city: admission?.city || "",
      state: admission?.state || "",
      country: admission?.country || "",
      gender: admission?.gender || "",
      selectedCourses: admission?.selectedCourses || [],
      notes: admission?.notes || "",
    }),
    [admission, user?.email],
  );

  const {
    register,
    reset,
    control,
    watch,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(admissionSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    reset({
      fullName: admission?.fullName || "",
      email: user?.email || "",
      contactNumber: admission?.contactNumber || "",
      dob: normalizeDate(admission?.dob),
      address: admission?.address || "",
      zipCode: admission?.zipCode || "",
      city: admission?.city || "",
      state: admission?.state || "",
      country: admission?.country || "",
      gender: admission?.gender || "",
      selectedCourses:
        admission?.selectedCourses?.map((course) =>
          typeof course === "object" ? course?._id?.toString() : String(course),
        ) || [],
      notes: admission?.notes || "",
    });
  }, [admission, user?.email, reset]);

  const isSubmitting = isJoining || isUpdating;

  useEffect(() => {
    if (hasExistingAdmission) setShowForm(true);
  }, [hasExistingAdmission]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      selectedCourses: Array.from(new Set(values.selectedCourses)),
      notes: values.notes?.trim() || undefined,
    };
    // The backend derives identity from the authenticated account.
    delete payload.email;
    try {
      if (admission?._id) {
        await update(payload).unwrap();
        toast.success("Admission updated", {
          description: "Your latest details have been saved.",
        });
      } else {
        await join(payload).unwrap();
        toast.success("Admission submitted", {
          description: "We will review and reach out shortly.",
        });
      }
    } catch (error) {
      toast.error(
        userMessage(error, "We could not save your application. Please try again."),
      );
    }
  };

  const selectedCount = watch("selectedCourses")?.length || 0;
  const completenessScore =
    (selectedCount ? 1 : 0) +
    (watch("fullName") ? 1 : 0) +
    (watch("contactNumber") ? 1 : 0) +
    (watch("dob") ? 1 : 0) +
    (watch("address") ? 1 : 0) +
    (watch("city") ? 1 : 0) +
    (watch("country") ? 1 : 0);
  const completeness = Math.min(100, Math.round((completenessScore / 7) * 100));

  const handleStartAdmission = () => {
    setShowForm(true);
    window.requestAnimationFrame(() =>
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  };

  const displayStatus = admission?.status || "not submitted";
  const snapshotStatusLabel = admission?.status || "pending";

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <Toaster richColors position="top-center" />

      <section className="border-b border-[#24564e] bg-[#123d36] text-white">
        <div className="page-container py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-[#e4c77d]">
                <Sparkles className="size-3.5" /> ADMISSION CENTER
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                Your pathway to guided Quran learning
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Tell us about your goals and study preferences. Our admissions
                team will review your details and help shape the right learning
                plan for you.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${statusTone[displayStatus] || statusTone.pending}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {formatStatus(displayStatus)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white/80">
                <ShieldCheck className="size-3.5 text-[#e4c77d]" />
                {hasExistingAdmission ? "Profile editable" : "Private & secure"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container pt-7 sm:pt-9">
        {!hasExistingAdmission && !showForm && (
          <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="p-6 sm:p-9 lg:p-12">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <ClipboardCheck className="size-3.5" /> No application
                  submitted
                </span>
                <h2 className="mt-5 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
                  Start your admission in a few simple steps
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Complete your profile once, choose the courses that interest
                  you, and return at any time to keep your information current.
                </p>
                <button
                  type="button"
                  onClick={handleStartAdmission}
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25"
                >
                  Start admission form <ArrowRight className="size-4" />
                </button>
                <div className="mt-7 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <LockKeyhole className="size-4 text-primary" />
                  Your details are only shared with the admissions team.
                </div>
              </div>
              <div className="border-t border-border bg-primary/5 p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  What happens next
                </p>
                <div className="mt-6 grid gap-6">
                  {[
                    [
                      "01",
                      "Share your details",
                      "Tell us about you and your learning goals.",
                    ],
                    [
                      "02",
                      "Get the right match",
                      "We review your needs and recommend the best path.",
                    ],
                    [
                      "03",
                      "Begin your journey",
                      "Confirm your schedule and meet your teacher.",
                    ],
                  ].map(([number, title, copy]) => (
                    <div key={number} className="flex gap-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#123d36] text-xs font-bold text-white">
                        {number}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {copy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {(hasExistingAdmission || showForm) && (
          <div
            ref={formSectionRef}
            className="grid scroll-mt-24 gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start"
          >
            <form onSubmit={submitForm(onSubmit)} className="grid gap-5">
              <section className="rounded-2xl border border-border bg-surface shadow-card">
                <SectionHeader
                  icon={UserRound}
                  title="Primary details"
                  description="Basic information we use to identify and contact you."
                />
                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                  <div>
                    <label className={labelClassName} htmlFor="full-name">
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="full-name"
                      placeholder="Your legal name"
                      className={inputClassName}
                      {...register("fullName")}
                    />
                    {errors.fullName && (
                      <p className={errorClassName}>
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClassName} htmlFor="email">
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        readOnly
                        className={`${inputClassName} pr-10`}
                        {...register("email")}
                      />
                      <LockKeyhole className="absolute right-3.5 top-[1.45rem] size-4 text-muted-foreground" />
                    </div>
                    <p className={helperClassName}>
                      Linked to your verified account.
                    </p>
                  </div>
                  <div>
                    <label className={labelClassName} htmlFor="contact-number">
                      Contact number <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="contact-number"
                      placeholder="+966 50 123 4567"
                      type="tel"
                      className={inputClassName}
                      {...register("contactNumber")}
                    />
                    <p className={helperClassName}>
                      WhatsApp is preferred for coordination.
                    </p>
                    {errors.contactNumber && (
                      <p className={errorClassName}>
                        {errors.contactNumber.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClassName}>
                      Date of birth <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="dob"
                      render={({ field }) => (
                        <DobPicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.dob && (
                      <p className={errorClassName}>{errors.dob.message}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-surface shadow-card">
                <SectionHeader
                  icon={MapPin}
                  title="Where you live"
                  description="This helps us coordinate teachers and class times."
                />
                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                  <div className="sm:col-span-2">
                    <label className={labelClassName} htmlFor="address">
                      Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="address"
                      placeholder="Street, building, area"
                      className={inputClassName}
                      {...register("address")}
                    />
                    {errors.address && (
                      <p className={errorClassName}>{errors.address.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClassName} htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="city"
                      placeholder="City"
                      className={inputClassName}
                      {...register("city")}
                    />
                    {errors.city && (
                      <p className={errorClassName}>{errors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClassName} htmlFor="state">
                      State / Province{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="state"
                      placeholder="State or province"
                      className={inputClassName}
                      {...register("state")}
                    />
                    {errors.state && (
                      <p className={errorClassName}>{errors.state.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClassName} htmlFor="country">
                      Country <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="country"
                      render={({ field }) => (
                        <select
                          id="country"
                          className={inputClassName}
                          value={field.value || ""}
                          onChange={field.onChange}
                        >
                          <option value="">Choose a country</option>
                          {countryOptions.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.country && (
                      <p className={errorClassName}>{errors.country.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClassName} htmlFor="zip-code">
                      Zip / Postal code
                    </label>
                    <input
                      id="zip-code"
                      placeholder="00000"
                      className={inputClassName}
                      {...register("zipCode")}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-surface shadow-card">
                <SectionHeader
                  icon={BookOpenCheck}
                  title="Learning preferences"
                  description="Select the study tracks that best match your goals."
                />
                <div className="grid gap-7 p-5 sm:p-7">
                  <div>
                    <label className={labelClassName}>
                      Gender <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {["male", "female", "other"].map((option) => {
                            const active = field.value === option;
                            return (
                              <label
                                key={option}
                                className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold capitalize transition ${active ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/10" : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                              >
                                <input
                                  type="radio"
                                  className="sr-only"
                                  value={option}
                                  checked={active}
                                  onChange={(event) =>
                                    field.onChange(event.target.value)
                                  }
                                />
                                {active && <Check className="size-3.5" />}
                                {option}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    />
                    {errors.gender && (
                      <p className={errorClassName}>{errors.gender.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label className={labelClassName}>
                        Choose course(s){" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                        {selectedCount} selected
                      </span>
                    </div>
                    <Controller
                      control={control}
                      name="selectedCourses"
                      render={({ field }) => (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {courses.map((course) => {
                            const courseId = String(course._id);
                            const checked = field.value?.includes(courseId);
                            return (
                              <label
                                key={course._id}
                                className={`group relative flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${checked ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"}`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={(event) => {
                                    const current = field.value || [];
                                    field.onChange(
                                      event.target.checked
                                        ? [...current, courseId]
                                        : current.filter(
                                            (id) => id !== courseId,
                                          ),
                                    );
                                  }}
                                />
                                <span
                                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-surface group-hover:border-primary/50"}`}
                                >
                                  {checked && <Check className="size-3.5" />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-bold leading-5">
                                    {course.title}
                                  </span>
                                  <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                                    {course.category || "Quran Studies"}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                          {courses.length === 0 && (
                            <div className="sm:col-span-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
                              Course options are loading or currently
                              unavailable.
                            </div>
                          )}
                        </div>
                      )}
                    />
                    {errors.selectedCourses && (
                      <p className={errorClassName}>
                        {errors.selectedCourses.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label className={labelClassName} htmlFor="notes">
                        Additional notes
                      </label>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Optional · max 500
                      </span>
                    </div>
                    <textarea
                      id="notes"
                      rows={4}
                      className={`${inputClassName} h-auto min-h-28 resize-y py-3`}
                      placeholder="Tell us about your goals, timing preferences, or any accommodations you need."
                      {...register("notes")}
                    />
                    {errors.notes && (
                      <p className={errorClassName}>{errors.notes.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4 border-t border-border bg-muted/45 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <ShieldCheck className="size-4 shrink-0 text-primary" />
                    {selectedCount
                      ? `${selectedCount} course${selectedCount > 1 ? "s" : ""} selected. You can update this later.`
                      : "Select at least one course to continue."}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {hasExistingAdmission ? "Save updates" : "Submit admission"}
                  </button>
                </div>
              </section>
            </form>

            <aside className="grid gap-5 lg:sticky lg:top-24">
              <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
                <div className="bg-[#123d36] p-5 text-white">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-[#e4c77d]" />
                    <h3 className="text-base font-bold">
                      Application snapshot
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/65">
                    A quick overview of what our team will review.
                  </p>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-muted/45 p-3">
                      <p className="text-[0.68rem] font-bold uppercase tracking-wide text-muted-foreground">
                        Status
                      </p>
                      <p className="mt-1.5 text-sm font-bold">
                        {formatStatus(snapshotStatusLabel)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/45 p-3">
                      <p className="text-[0.68rem] font-bold uppercase tracking-wide text-muted-foreground">
                        Courses
                      </p>
                      <p className="mt-1.5 text-sm font-bold">
                        {selectedCount ||
                          admission?.selectedCourses?.length ||
                          0}{" "}
                        selected
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3 text-xs font-bold">
                      <span className="text-muted-foreground">
                        Profile completeness
                      </span>
                      <span className="text-primary">{completeness}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 border-t border-border pt-5">
                    <div className="flex gap-3">
                      <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs font-bold">24–48 hour review</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          We contact you by WhatsApp and email.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs font-bold">
                          One profile per student
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Update this form whenever your needs change.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 border-t border-border bg-primary/5 px-5 py-4 text-xs font-semibold leading-5 text-primary">
                  <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                  Only the admissions team can view your information.
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
                <h3 className="text-sm font-bold">Your next steps</h3>
                <div className="mt-4 grid gap-4">
                  {[
                    ["1", "Complete your profile"],
                    ["2", "Admissions review"],
                    ["3", "Teacher matching"],
                  ].map(([number, label], index) => (
                    <div key={number} className="flex items-center gap-3">
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {number}
                      </span>
                      <span
                        className={`text-xs font-bold ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>

      {(isAdmissionLoading || isSubmitting) && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#123d36]/35 px-4 backdrop-blur-sm">
          <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-sm font-bold shadow-raised">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span>
              {isAdmissionLoading
                ? "Loading your admission..."
                : "Saving changes..."}
            </span>
          </div>
        </div>
      )}
    </main>
  );
};

export default Admission;
