import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
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

function FeedbackCard({ item, busyAction, onUpdate }) {
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

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">
              {item.subject || `${titleCase(item.type)} ${shortId(item._id)}`}
            </h3>
            <StatusBadge value={statusTone[item.status]} label={titleCase(item.status)} />
            <StatusBadge value={priorityTone[item.priority]} label={titleCase(item.priority)} />
          </div>
          <div className="mt-3 grid gap-1 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
            <span>
              <b className="text-slate-700">{item.name}</b>
            </span>
            <span>{item.phone}</span>
            <span>{item.email || "No email"}</span>
            <span>{item.branch || "Branch not selected"}</span>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {item.message}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span>{dateTime(item.createdAt)}</span>
            {item.orderNumber && <span>Order: {item.orderNumber}</span>}
            {item.handledByName && <span>Handled by {item.handledByName}</span>}
          </div>
        </div>

        <form
          className="grid w-full shrink-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 xl:w-96"
          onSubmit={save}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="field"
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
            <select
              className="field"
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
          <Button type="submit" className="min-h-10" disabled={busy}>
            {busy ? "Saving..." : "Save response"}
          </Button>
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
}) {
  const updateFilter = (key, value) => onFilterChange({ ...filters, [key]: value });

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

      <section className="grid gap-3">
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

        {!loading &&
          feedback.map((item) => (
            <FeedbackCard
              key={item._id}
              item={item}
              busyAction={busyAction}
              onUpdate={onUpdate}
            />
          ))}

        {loading && (
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
      </section>
    </div>
  );
}
