import { userMessage } from "@/lib/user-messages.js";
import { useMemo, useState } from "react";
import "./admin-admissions.css";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import { toast, Toaster } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  XCircle,
} from "lucide-react";

import {
  useDeleteAdminAdmissionMutation,
  useGetAdminAdmissionsQuery,
  useUpdateAdminAdmissionStatusMutation,
} from "@/services/api/admin/adminAdmissionApis.js";

const statusOptions = ["", "pending", "in-review", "accepted", "rejected"];

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  "in-review": {
    label: "In review",
    icon: FileText,
    className: "border-info/20 bg-info/10 text-info",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    className: "border-success/20 bg-success/10 text-success",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className:
      "border-[color-mix(in_srgb,var(--destructive)_22%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] text-[var(--destructive)]",
  },
};

const formatStatus = (value) => statusConfig[value]?.label || "Pending";

const StatusBadge = ({ value }) => {
  const status = value || "pending";
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
};

const AdminAdmissions = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState(null);

  const queryArgs = useMemo(
    () => ({ page, limit: 15, status, search }),
    [page, status, search],
  );

  const { data, isFetching, refetch } = useGetAdminAdmissionsQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
  });

  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateAdminAdmissionStatusMutation();
  const [deleteAdmission, { isLoading: isDeleting }] =
    useDeleteAdminAdmissionMutation();

  const items = useMemo(() => data?.items || [], [data?.items]);
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const pageStats = useMemo(
    () => ({
      reviewQueue: items.filter((item) =>
        ["pending", "in-review"].includes(item.status || "pending"),
      ).length,
      accepted: items.filter((item) => item.status === "accepted").length,
      rejected: items.filter((item) => item.status === "rejected").length,
    }),
    [items],
  );

  const onSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setPage(1);
    setStatus("");
    setSearch("");
    setSearchInput("");
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      await updateStatus({ id, status: nextStatus }).unwrap();
      toast.success("Admission status updated");
    } catch (error) {
      toast.error(userMessage(error, "We could not update the admission status. Please try again."));
    }
  };

  const handleDelete = async (id) => {
    if (!id || isDeleting) return;
    setPendingDeletion(null);
    try {
      await deleteAdmission(id).unwrap();
      toast.success("Admission deleted");
    } catch (error) {
      toast.error(userMessage(error, "We could not delete this admission. Please try again."));
    }
  };

  return (
    <main className="admin-admissions min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <Toaster richColors position="top-center" />
      <div className="mx-auto w-full max-w-7xl">
        <header className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <ShieldCheck className="size-3.5" />
                Admin Panel
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                Student Admissions
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Review applications, verify contact details, update admission
                status, and keep enrollment decisions moving.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-60"
            >
              <RefreshCcw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Total applications
              </p>
              <Inbox className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {pagination.total || 0}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Review queue
              </p>
              <Clock3 className="size-4 text-warning" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {pageStats.reviewQueue}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Accepted here
              </p>
              <UserRoundCheck className="size-4 text-success" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {pageStats.accepted}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Page
              </p>
              <BookOpen className="size-4 text-accent-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {pagination.page || 1} / {pagination.totalPages || 1}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <form
              onSubmit={onSearchSubmit}
              className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row"
            >
              <div className="admissions-search-field flex min-h-11 min-w-0 flex-none items-center gap-3 rounded-lg border border-input bg-background px-3 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20 sm:flex-1">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  aria-label="Search admissions"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  placeholder="Search by name, email, city, country..."
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                <Search className="size-4" />
                Search
              </button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-semibold text-muted-foreground">
                <Filter className="size-4" />
                <select
                  aria-label="Filter admissions by status"
                  value={status}
                  onChange={(event) => {
                    setPage(1);
                    setStatus(event.target.value);
                  }}
                  className="min-w-36 bg-transparent text-sm font-semibold text-foreground outline-none"
                >
                  {statusOptions.map((item) => (
                    <option key={item || "all"} value={item}>
                      {item ? formatStatus(item) : "All statuses"}
                    </option>
                  ))}
                </select>
              </label>

              {(search || status) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 rounded-lg border border-border bg-surface px-4 text-sm font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="relative mt-5 overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <div className="admissions-results">
            <table className="admissions-table w-full border-collapse text-left text-sm" role="table" aria-label="Student admissions">
              <thead className="border-b border-border bg-secondary">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Student
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Contact
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Location
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Courses
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border" role="rowgroup">
                {items.map((admission) => (
                  <tr
                    key={admission._id}
                    role="row"
                    className="transition hover:bg-muted/70"
                  >
                    <td data-label="Student" role="cell" className="px-5 py-4 align-top">
                      <p className="font-bold text-foreground">
                        {admission.fullName || "--"}
                      </p>
                      <p className="mt-1 max-w-60 truncate text-xs text-muted-foreground">
                        {admission.email || "--"}
                      </p>
                    </td>
                    <td data-label="Contact" role="cell" className="px-5 py-4 align-top">
                      <div className="grid gap-1.5 text-xs text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Phone className="size-3.5" />
                          {admission.contactNumber || "--"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="size-3.5" />
                          {admission.email || "--"}
                        </p>
                      </div>
                    </td>
                    <td data-label="Location" role="cell" className="px-5 py-4 align-top">
                      <p className="flex items-center gap-2 font-semibold text-foreground">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        {admission.city || "--"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {admission.country || "--"}
                      </p>
                    </td>
                    <td data-label="Courses" role="cell" className="px-5 py-4 align-top">
                      <p className="inline-flex items-center gap-2 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                        <BookOpen className="size-3.5" />
                        {admission.selectedCourses?.length || 0} selected
                      </p>
                    </td>
                    <td data-label="Status" role="cell" className="px-5 py-4 align-top">
                      <div className="grid gap-2">
                        <StatusBadge value={admission.status} />
                        <select
                          aria-label={`Admission status for ${admission.fullName || admission.email || "learner"}`}
                          value={admission.status || "pending"}
                          onChange={(event) =>
                            handleStatusChange(admission._id, event.target.value)
                          }
                          disabled={isUpdatingStatus}
                          className="h-9 w-36 rounded-lg border border-input bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-60"
                        >
                          {statusOptions.filter(Boolean).map((item) => (
                            <option key={item} value={item}>
                              {formatStatus(item)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td data-label="Actions" role="cell" className="px-5 py-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setPendingDeletion(admission._id)}
                        disabled={isDeleting}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--destructive)_22%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] px-3 text-xs font-bold text-[var(--destructive)] transition hover:bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] disabled:pointer-events-none disabled:opacity-60"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!isFetching && items.length === 0 && (
                  <tr>
                    <td colSpan={6} role="cell" className="admissions-empty px-5 py-16 text-center">
                      <div className="mx-auto grid max-w-sm place-items-center">
                        <span className="grid size-12 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <Inbox className="size-6" />
                        </span>
                        <p className="mt-4 text-sm font-bold text-foreground">
                          No admissions found
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Adjust the search or status filter to review another
                          set of applications.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(isFetching || isUpdatingStatus || isDeleting) && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-[1px]">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-bold text-foreground shadow-card">
                <Loader2 className="size-4 animate-spin text-primary" />
                Processing...
              </div>
            </div>
          )}
        </section>

        <footer className="mt-5 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            Showing {items.length} of {pagination.total || 0} admissions
          </p>
          <div className="admissions-pagination flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              Prev
            </button>
            <span className="grid h-10 min-w-28 place-items-center rounded-lg bg-secondary px-3 text-sm font-bold text-foreground">
              {pagination.page || 1} / {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
              onClick={() => setPage((prev) => prev + 1)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>
      </div>
      <ConfirmationModal
        open={Boolean(pendingDeletion)}
        title="Delete this admission record?"
        description="This admission record will be permanently removed. This cannot be undone."
        confirmLabel="Delete admission"
        danger
        onCancel={() => setPendingDeletion(null)}
        onConfirm={() => handleDelete(pendingDeletion)}
      />
    </main>
  );
};

export default AdminAdmissions;
