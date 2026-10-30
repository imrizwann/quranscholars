import SelectField from "@/components/ui/SelectField.jsx";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import { DashboardMetrics } from "@/components/lms/DashboardParts.jsx";
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
  Inbox,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,  Trash2,
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

  const { currentData: data, isFetching, error, refetch } = useGetAdminAdmissionsQuery(queryArgs, {
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
    <WorkspacePage eyebrow="Administration" title="Student admissions" description="Review learner applications and manage admission decisions." action={<button type="button" onClick={refetch} disabled={isFetching} className="cw-button"><RefreshCcw size={16} aria-hidden="true" />Refresh</button>}>
      <Toaster richColors position="top-center" />
      <div className="admin-admissions">
        <DashboardMetrics items={[
          { label: "Matching applications", value: error ? "Unavailable" : pagination.total, loading: !data && !error, icon: Inbox, note: "Across the current filters" },
          { label: "Awaiting review", value: error ? "Unavailable" : pageStats.reviewQueue, loading: !data && !error, icon: Clock3, note: "On this page" },
          { label: "Accepted", value: error ? "Unavailable" : pageStats.accepted, loading: !data && !error, icon: UserRoundCheck, note: "On this page" },
          { label: "Rejected", value: error ? "Unavailable" : pageStats.rejected, loading: !data && !error, icon: XCircle, note: "On this page" },
        ]} />
        {error && <section className="studio-panel mt-5" role="alert"><h2>Could not load admissions</h2><p>{userMessage(error)}</p><button type="button" className="cw-button mt-4" onClick={refetch} disabled={isFetching}>Try again</button></section>}
        <section className="mt-5 rounded-lg border border-border bg-surface p-4">
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
                className="cw-button cw-primary"
              >
                <Search className="size-4" />
                Search
              </button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SelectField
                aria-label="Filter admissions by status"
                value={status || "all"}
                options={statusOptions.map((item) => ({ value: item || "all", label: item ? formatStatus(item) : "All statuses" }))}
                onChange={(value) => { setPage(1); setStatus(value === "all" ? "" : value); }}
                className="w-full sm:w-44"
              />

              {(search || status) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="cw-button"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="relative mt-5 overflow-hidden rounded-lg border border-border bg-surface">
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
                        <SelectField
                          aria-label={`Admission status for ${admission.fullName || admission.email || "learner"}`}
                          value={admission.status || "pending"}
                          onChange={(value) => handleStatusChange(admission._id, value)}
                          disabled={isUpdatingStatus || Boolean(error)}
                          options={statusOptions.filter(Boolean).map((item) => ({ value: item, label: formatStatus(item) }))}
                          className="w-40 max-w-full"
                        />
                      </div>
                    </td>
                    <td data-label="Actions" role="cell" className="px-5 py-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setPendingDeletion(admission._id)}
                        disabled={isDeleting || Boolean(error)}
                        className="cw-button cw-danger"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!isFetching && !error && items.length === 0 && (
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
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-bold text-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                Processing...
              </div>
            </div>
          )}
        </section>

        <footer className="mt-5 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            Showing {items.length} of {pagination.total || 0} admissions
          </p>
          <div className="admissions-pagination flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="cw-button"
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
              className="cw-button"
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
    </WorkspacePage>
  );
};

export default AdminAdmissions;
