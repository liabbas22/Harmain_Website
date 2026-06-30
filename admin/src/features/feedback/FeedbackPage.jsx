import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { InlineLoadingBar } from "../../components/ui/LoadingStates";
import StatusBadge from "../../components/ui/StatusBadge";
import { FEEDBACK_PRIORITIES, FEEDBACK_STATUSES } from "../../constants/admin";
import { dateTime, shortId, titleCase } from "../../utils/format";

const typeOptions = [
  ["all", "All types"],
  ["complaint", "Complaints"],
  ["feedback", "Feedback"],
  ["suggestion", "Suggestions"],
];

const priorityTone = {
  low: "available",
  normal: "pending",
  high: "processing",
  urgent: "unavailable",
};

const statusTone = {
  new: "pending",
  in_review: "processing",
  resolved: "completed",
  closed: "refunded",
};

const cardAccent = {
  new: "from-brand-600 to-red-500",
  in_review: "from-amber-500 to-orange-400",
  resolved: "from-emerald-600 to-green-500",
  closed: "from-slate-500 to-slate-400",
};

function FeedbackCard({ item, busyAction, onUpdate, onMarkRead }) {
  const [draft, setDraft] = useState({
    status: item.status,
    priority: item.priority,
    adminReply: item.adminReply || "",
    internalNote: item.internalNote || "",
  });

  useEffect(() => {
    setDraft({
      status: item.status,
      priority: item.priority,
      adminReply: item.adminReply || "",
      internalNote: item.internalNote || "",
    });
  }, [item]);

  const save = async (event) => {
    event.preventDefault();
    await onUpdate(item._id, draft);
  };

  const busy = busyAction === `feedback-${item._id}`;
  const readBusy = busyAction === `feedback-read-${item._id}`;
  const typeLabel = titleCase(item.type || "feedback");
  const contactItems = [
    ["Customer", item.name || "Customer"],
    ["Phone", item.phone || "No phone"],
    ["Email", item.email || "No email"],
    ["Branch", item.branch || "Branch not selected"],
  ];

  return (
    <article className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-red-100 hover:shadow-md">
      <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${cardAccent[item.status] || cardAccent.closed}`} />
      <div className="grid gap-4 p-4 pl-5 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
                  {typeLabel}
                </span>
                <span className="text-xs font-extrabold text-slate-400">
                  {shortId(item._id)}
                </span>
              </div>
              <h3 className="mt-2 text-base font-extrabold text-slate-900">
                {item.subject || `Website ${typeLabel.toLowerCase()}`}
              </h3>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <StatusBadge value={statusTone[item.status]} label={titleCase(item.status)} />
              <StatusBadge value={priorityTone[item.priority]} label={titleCase(item.priority)} />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {contactItems.map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                  {label}
                </span>
                <b className="mt-1 block truncate text-xs text-slate-800">
                  {value}
                </b>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Customer message
              </span>
            </div>
            <p className="px-4 py-3 text-sm leading-6 text-slate-700">
              {item.message}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span>Received {dateTime(item.createdAt)}</span>
            {item.orderNumber && <span>Order: {item.orderNumber}</span>}
            {item.handledByName && <span>Handled by {item.handledByName}</span>}
            {item.expiresAt && (
              <span className="text-red-700">
                Auto delete {dateTime(item.expiresAt)}
              </span>
            )}
          </div>
        </div>

        <form
          className="grid w-full shrink-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
          onSubmit={save}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Admin workflow
              </h4>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Update status, priority, and follow-up notes.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Status
              <select
                className="field normal-case"
                value={draft.status}
                onChange={(event) =>
                  setDraft({ ...draft, status: event.target.value })
                }
              >
                {FEEDBACK_STATUSES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Priority
              <select
                className="field normal-case"
                value={draft.priority}
                onChange={(event) =>
                  setDraft({ ...draft, priority: event.target.value })
                }
              >
                {FEEDBACK_PRIORITIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <textarea
            className="field min-h-20 resize-none"
            value={draft.adminReply}
            onChange={(event) =>
              setDraft({ ...draft, adminReply: event.target.value })
            }
            placeholder="Customer reply note"
          />
          <textarea
            className="field min-h-20 resize-none"
            value={draft.internalNote}
            onChange={(event) =>
              setDraft({ ...draft, internalNote: event.target.value })
            }
            placeholder="Internal admin note"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {item.status === "new" && (
              <Button
                type="button"
                variant="secondary"
                className="min-h-10"
                disabled={readBusy}
                onClick={() => onMarkRead(item._id)}
              >
                {readBusy ? "Marking..." : "Mark read"}
              </Button>
            )}
            <Button
              type="submit"
              className={item.status === "new" ? "min-h-10" : "min-h-10 sm:col-span-2"}
              disabled={busy}
            >
              {busy ? "Saving..." : "Save response"}
            </Button>
          </div>
        </form>
      </div>
    </article>
  );
}

export default function FeedbackPage({
  feedback,
  total,
  filters,
  loading,
  error,
  busyAction,
  onFilterChange,
  onUpdate,
  onMarkRead,
}) {
  const updateFilter = (key, value) => onFilterChange({ ...filters, [key]: value });
  const initialLoading = loading && !feedback.length;

  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Complaint and feedback inbox
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage customer complaints, suggestions, branch feedback, and
            follow-up notes.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[180px_180px_180px_260px]">
          <select
            className="field"
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="all">All statuses</option>
            {FEEDBACK_STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={filters.priority}
            onChange={(event) => updateFilter("priority", event.target.value)}
          >
            <option value="all">All priorities</option>
            {FEEDBACK_PRIORITIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={filters.type}
            onChange={(event) => updateFilter("type", event.target.value)}
          >
            {typeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="field"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search name, phone, email"
          />
        </div>
      </section>

      <section className="relative grid gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Customer messages
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {total} total messages match the current filters.
              </p>
            </div>
            {loading && (
              <span className="text-xs font-extrabold text-brand-700">
                Refreshing...
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!initialLoading &&
          feedback.map((item) => (
            <FeedbackCard
              key={item._id}
              item={item}
              busyAction={busyAction}
              onUpdate={onUpdate}
              onMarkRead={onMarkRead}
            />
          ))}

        {initialLoading && (
          <div className="grid gap-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!loading && !feedback.length && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center">
            <h3 className="text-sm font-extrabold text-slate-900">
              No messages found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              New complaint form submissions will appear here automatically.
            </p>
          </div>
        )}
        {loading && !initialLoading && <InlineLoadingBar />}
      </section>
    </div>
  );
}
