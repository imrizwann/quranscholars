import { Link } from "react-router-dom";
import { useEditStudentDetails } from "@/hooks/userInfo/useEditStudentDetails.js";
import {
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  Edit3,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";

const fields = [
  { key: "fullName", label: "Full name" },
  { key: "email", label: "Email address", locked: true },
  { key: "contactNumber", label: "Contact number" },
  { key: "dob", label: "Date of birth", type: "date" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State / Province" },
  { key: "country", label: "Country" },
  { key: "zipCode", label: "Postal / ZIP code" },
  { key: "gender", label: "Gender" },
  { key: "status", label: "Application status", locked: true },
  { key: "notes", label: "Notes / preferences", multiline: true },
];

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const StudentInfo = () => {
  const {
    userDetails,
    editableFields,
    handleEdit,
    handleChange,
    handleCancel,
    handleSave,
    error,
    admissionDetailsLoading,
    saveLoading,
  } = useEditStudentDetails();

  const hasData = Object.keys(userDetails || {}).length > 0;
  const selectedCourseLabels = (userDetails?.selectedCourses || [])
    .map((course, index) => {
      if (typeof course === "string") return /^[a-f\d]{24}$/i.test(course) ? `Selected course ${index + 1}` : course;
      return course?.title || course?.name || `Selected course ${index + 1}`;
    })
    .filter(Boolean);

  if (admissionDetailsLoading) {
    return <main className="grid min-h-[65vh] place-items-center bg-[#f5f8f6] px-4"><div className="flex items-center gap-3 rounded-2xl border border-[#dfe6e2] bg-white px-6 py-5 text-sm font-black text-[#476057] shadow-sm"><Loader2 className="size-5 animate-spin text-primary" />Loading your dashboard…</div></main>;
  }

  if (!hasData) {
    return (
      <main className="grid min-h-[65vh] place-items-center bg-[#f5f8f6] px-4 py-16">
        <section className="w-full max-w-2xl rounded-2xl border border-[#dfe6e2] bg-white p-7 text-center shadow-[0_18px_50px_rgba(21,54,44,.07)] sm:p-10" aria-labelledby="no-admission-title">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e6f2ed] text-primary"><BookOpenCheck className="size-6" /></span>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.15em] text-primary">Set up your learning profile</p>
          <h1 id="no-admission-title" className="mt-2 text-balance font-display text-3xl font-black tracking-[-0.04em] sm:text-4xl">Complete admission to unlock your dashboard.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-[#687970]">Submit your learning preferences so the team can review your needs, selected courses, and preferred schedule.</p>
          <Link to="/admission" className="group mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#0f766e] px-5 text-sm font-black text-white no-underline">Go to admission <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
        </section>
      </main>
    );
  }

  const status = userDetails.status || "pending";

  return (
    <main className="bg-[#f5f8f6] px-4 py-10 text-[#172b24] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-primary">Student dashboard</p><h1 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] sm:text-4xl">Your learning profile</h1><p className="mt-3 text-sm font-medium leading-6 text-[#687970]">Review admission details, course choices, and your current application status.</p></div>
          <div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#e1f1eb] px-3 py-1.5 text-xs font-black capitalize text-[#176255]">{status}</span><span className="rounded-full border border-[#d7e2dc] bg-white px-3 py-1.5 text-xs font-black text-[#51665c]">{selectedCourseLabels.length} {selectedCourseLabels.length === 1 ? "course" : "courses"}</span></div>
        </header>

        {error && <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</div>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.55fr)] lg:items-start">
          <section className="rounded-2xl border border-[#dfe6e2] bg-white shadow-[0_15px_45px_rgba(21,54,44,.05)]" aria-labelledby="admission-details-title">
            <div className="border-b border-[#e5ebe8] px-6 py-5 sm:px-8"><h2 id="admission-details-title" className="text-xl font-black tracking-[-0.025em]">Admission details</h2><p className="mt-1 text-sm font-medium text-[#718078]">Edit one field at a time and save when finished.</p></div>
            <div className="grid gap-px bg-[#e5ebe8] sm:grid-cols-2">
              {fields.map((field) => {
                const value = userDetails?.[field.key] || "";
                const isEditing = Boolean(editableFields[field.key]);
                const displayValue = field.type === "date" && value ? toDateInputValue(value) : value;
                return (
                  <div key={field.key} className={`relative bg-white p-5 ${field.multiline ? "sm:col-span-2" : ""}`}>
                    <div className="flex items-center justify-between gap-3"><label htmlFor={`student-${field.key}`} className="text-xs font-black uppercase tracking-[0.1em] text-[#718078]">{field.label}</label>{field.locked ? <span className="inline-flex items-center gap-1 text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#87958e]"><LockKeyhole className="size-3" />Locked</span> : !isEditing && <button type="button" onClick={() => handleEdit(field.key)} className="grid size-8 place-items-center rounded-lg text-[#60736a] transition hover:bg-[#edf4f1] hover:text-primary" aria-label={`Edit ${field.label}`}><Edit3 className="size-3.5" /></button>}</div>
                    {field.multiline ? <textarea id={`student-${field.key}`} name={field.key} value={displayValue} onChange={handleChange} readOnly={!isEditing || field.locked} rows={3} className={`mt-2 w-full resize-y rounded-xl border px-3.5 py-3 text-sm font-semibold leading-6 outline-none transition ${isEditing ? "border-primary bg-white ring-4 ring-[#0f766e]/10" : "border-transparent bg-[#f5f8f6] text-[#53665e]"}`} placeholder="Not provided" /> : <input id={`student-${field.key}`} name={field.key} type={field.type || "text"} value={displayValue} onChange={handleChange} readOnly={!isEditing || field.locked} className={`mt-2 min-h-11 w-full rounded-xl border px-3.5 text-sm font-semibold outline-none transition ${isEditing ? "border-primary bg-white ring-4 ring-[#0f766e]/10" : "border-transparent bg-[#f5f8f6] text-[#53665e]"}`} placeholder="Not provided" />}
                    {isEditing && !field.locked && <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => handleCancel(field.key)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#d8e2dd] px-3 text-xs font-black text-[#5c6e65]"><X className="size-3.5" />Cancel</button><button type="button" onClick={() => handleSave(field.key, userDetails[field.key])} disabled={saveLoading} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#0f766e] px-3 text-xs font-black text-white disabled:opacity-60">{saveLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}Save</button></div>}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="grid gap-6">
            <section className="rounded-2xl border border-[#dfe6e2] bg-white p-6" aria-labelledby="selected-courses-title"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e6f2ed] text-primary"><BookOpenCheck className="size-4.5" /></span><div><h2 id="selected-courses-title" className="font-black">Selected courses</h2><p className="text-xs font-medium text-[#718078]">From your admission</p></div></div>{selectedCourseLabels.length ? <ul className="mt-5 grid gap-2">{selectedCourseLabels.map((course, index) => <li key={`${course}-${index}`} className="rounded-xl bg-[#f2f6f4] px-3.5 py-3 text-sm font-bold leading-5 text-[#456056]">{course}</li>)}</ul> : <p className="mt-5 rounded-xl border border-dashed border-[#cedbd5] p-4 text-sm font-medium leading-6 text-[#718078]">No courses are currently selected.</p>}<Link to="/admission" className="group mt-5 inline-flex items-center gap-2 text-xs font-black text-primary no-underline">Review admission <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></Link></section>
            <section className="rounded-2xl bg-[#0b3e38] p-6 text-white" aria-labelledby="status-title"><ShieldCheck className="size-5 text-[#f4c95d]" /><p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#9ed6c8]">Application status</p><h2 id="status-title" className="mt-1 text-2xl font-black capitalize">{status}</h2><p className="mt-3 text-sm font-medium leading-6 text-white/68">Status changes and requests for additional information are communicated through your registered contact details.</p></section>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default StudentInfo;
