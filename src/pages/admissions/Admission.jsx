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
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  MapPin,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import DateOfBirthPicker from "@/components/ui/DateOfBirthPicker.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import WelcomeActions from "./WelcomeActions.jsx";
import "./admission.css";

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

const inputClassName = "admission-input";
const labelClassName = "admission-label";
const errorClassName = "mt-1.5 text-xs font-semibold text-destructive";
const helperClassName = "mt-1.5 text-xs leading-5 text-muted-foreground";

const formatStatus = (value) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="admission-section-header">
    <span className="public-icon">
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
  const { data, isLoading: isCoursesLoading, isError: isCoursesError, refetch: refetchCourses } = useGetCoursesQuery();
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
    (watch("country") ? 1 : 0) +
    (watch("state") ? 1 : 0) +
    (watch("gender") ? 1 : 0);
  const completeness = Math.min(100, Math.round((completenessScore / 9) * 100));

  const handleStartAdmission = () => {
    setShowForm(true);
    window.requestAnimationFrame(() => {
      formSectionRef.current?.focus({ preventScroll: true });
      formSectionRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const snapshotStatusLabel = admission?.status || "draft";

  return (
    <main className="admission-page min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      <WelcomeActions
        name={user?.name}
        hasAdmission={hasExistingAdmission}
        formOpen={hasExistingAdmission || showForm}
        onStartAdmission={handleStartAdmission}
      />

      <div className="public-page admission-container">
        {(hasExistingAdmission || showForm) && (
          <div
            ref={formSectionRef}
            id="admission-form"
            tabIndex={-1}
            role="region"
            aria-label="Admission application"
            className="admission-layout"
          >
            <form onSubmit={submitForm(onSubmit)} className="admission-form">
              <section className="admission-panel">
                <SectionHeader
                  icon={UserRound}
                  title="Primary details"
                  description="Basic information we use to identify and contact you."
                />
                <div className="admission-fields">
                  <div>
                    <label className={labelClassName} htmlFor="full-name">
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="full-name"
                      placeholder="Your legal name"
                      className={inputClassName}
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={errors.fullName ? "admission-fullName-error" : undefined}
                      {...register("fullName")}
                    />
                    {errors.fullName && (
                      <p id="admission-fullName-error" className={errorClassName}>
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
                        className={`${inputClassName} admission-email`}
                        {...register("email")}
                      />
                      <LockKeyhole className="absolute right-3.5 top-1/2 size-4 text-muted-foreground" />
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
                      aria-invalid={Boolean(errors.contactNumber)}
                      aria-describedby={errors.contactNumber ? "admission-contactNumber-error" : undefined}
                      {...register("contactNumber")}
                    />
                    <p className={helperClassName}>
                      WhatsApp is preferred for coordination.
                    </p>
                    {errors.contactNumber && (
                      <p id="admission-contactNumber-error" className={errorClassName}>
                        {errors.contactNumber.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClassName} htmlFor="date-of-birth">
                      Date of birth <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="dob"
                      render={({ field }) => (
                        <div className="mt-2"><DateOfBirthPicker
                          id="date-of-birth"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          triggerRef={field.ref}
                          error={errors.dob?.message}
                        /></div>
                      )}
                    />
                  </div>
                  <fieldset className="admission-wide">
                    <legend className={labelClassName}>
                      Gender <span className="text-destructive">*</span>
                    </legend>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <div className="admission-gender-options">
                          {["male", "female", "other"].map((option) => {
                            const active = field.value === option;
                            return (
                              <label
                                key={option}
                                className={`admission-gender-option${active ? " is-selected" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name={field.name}
                                  onBlur={field.onBlur}
                                  ref={field.ref}
                                  aria-invalid={Boolean(errors.gender)}
                                  aria-describedby={errors.gender ? "admission-gender-error" : undefined}
                                  className="admission-choice-input"
                                  value={option}
                                  checked={active}
                                  onChange={(event) =>
                                    field.onChange(event.target.value)
                                  }
                                />
                                {option}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    />
                    {errors.gender && (
                      <p id="admission-gender-error" className={errorClassName}>{errors.gender.message}</p>
                    )}
                  </fieldset>
                </div>
              </section>

              <section className="admission-panel">
                <SectionHeader
                  icon={MapPin}
                  title="Where you live"
                  description="This helps us coordinate teachers and class times."
                />
                <div className="admission-fields">
                  <div className="admission-wide">
                    <label className={labelClassName} htmlFor="address">
                      Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="address"
                      placeholder="Street, building, area"
                      className={inputClassName}
                      aria-invalid={Boolean(errors.address)}
                      aria-describedby={errors.address ? "admission-address-error" : undefined}
                      {...register("address")}
                    />
                    {errors.address && (
                      <p id="admission-address-error" className={errorClassName}>{errors.address.message}</p>
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
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? "admission-city-error" : undefined}
                      {...register("city")}
                    />
                    {errors.city && (
                      <p id="admission-city-error" className={errorClassName}>{errors.city.message}</p>
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
                      aria-invalid={Boolean(errors.state)}
                      aria-describedby={errors.state ? "admission-state-error" : undefined}
                      {...register("state")}
                    />
                    {errors.state && (
                      <p id="admission-state-error" className={errorClassName}>{errors.state.message}</p>
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
                        <SelectField
                          id="country"
                          name={field.name}
                          className="mt-2"
                          value={field.value || null}
                          options={countryOptions}
                          placeholder="Choose a country"
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          triggerRef={field.ref}
                          error={errors.country?.message}
                        />
                      )}
                    />
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

              <section className="admission-panel">
                <SectionHeader
                  icon={BookOpenCheck}
                  title="Learning preferences"
                  description="Select the study tracks that best match your goals."
                />
                <div className="admission-preferences">


                  <div role="group" aria-labelledby="admission-courses-label">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p id="admission-courses-label" className={labelClassName}>
                        Choose courses{" "}
                        <span className="text-destructive">*</span>
                      </p>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                        {selectedCount} selected
                      </span>
                    </div>
                    <Controller
                      control={control}
                      name="selectedCourses"
                      render={({ field }) => (
                        <div className="admission-course-options">
                          {courses.map((course) => {
                            const courseId = String(course._id);
                            const checked = field.value?.includes(courseId);
                            return (
                              <label
                                key={course._id}
                                className={`admission-course-option${checked ? " is-selected" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  name={field.name}
                                  value={courseId}
                                  onBlur={field.onBlur}
                                  ref={field.ref}
                                  aria-invalid={Boolean(errors.selectedCourses)}
                                  aria-describedby={errors.selectedCourses ? "admission-courses-error" : undefined}
                                  className="admission-choice-input"
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
                            <div className="admission-course-state" role={isCoursesError ? "alert" : "status"}>
                              {isCoursesLoading ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Loading courses...</> : isCoursesError ? <>
                                <span>We could not load the courses.</span>
                                <button type="button" className="cw-button cw-button-compact" onClick={refetchCourses}>Try again</button>
                              </> : "No courses are available for admission right now."}
                            </div>
                          )}
                        </div>
                      )}
                    />
                    {errors.selectedCourses && (
                      <p id="admission-courses-error" className={errorClassName}>
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
                      className={`${inputClassName} admission-notes`}
                      placeholder="Tell us about your goals, timing preferences, or any accommodations you need."
                      aria-invalid={Boolean(errors.notes)}
                      aria-describedby={errors.notes ? "admission-notes-error" : undefined}
                      {...register("notes")}
                    />
                    {errors.notes && (
                      <p id="admission-notes-error" className={errorClassName}>{errors.notes.message}</p>
                    )}
                  </div>
                </div>
                <div className="admission-submit-row">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <ShieldCheck className="size-4 shrink-0 text-primary" />
                    {selectedCount
                      ? `${selectedCount} course${selectedCount > 1 ? "s" : ""} selected. You can update this later.`
                      : "Select at least one course to continue."}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cw-button cw-primary"
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

            <aside className="admission-sidebar">
              <section className="admission-panel overflow-hidden">
                <div className="admission-snapshot-header">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-primary" />
                    <h3 className="text-base font-bold">
                      Application snapshot
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
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
                        {selectedCount}{" "}
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

              <section className="admission-panel p-5">
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
