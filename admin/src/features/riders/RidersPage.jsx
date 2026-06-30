import Button from "../../components/ui/Button";
import { InlineLoadingBar, TableSkeleton } from "../../components/ui/LoadingStates";
import StatusBadge from "../../components/ui/StatusBadge";

export default function RidersPage({ riders, loading, onNew, onEdit }) {
  const initialLoading = loading && !riders.length;

  return (
    <div className="grid gap-5 mt-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Delivery team
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and maintain riders available for order assignment.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={onNew}>
          Add rider
        </Button>
      </section>
      <section className="relative overflow-hidden bg-white border rounded-lg border-slate-200">
        {initialLoading ? (
          <TableSkeleton rows={5} columns={4} minWidth="640px" />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="h-11 border-b border-slate-200 bg-slate-50 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                <th className="px-4">Rider</th>
                <th className="px-4">Phone</th>
                <th className="px-4">Availability</th>
                <th className="px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <tr
                  key={rider._id}
                  className="text-sm border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-4">
                    <strong className="block text-slate-800">
                      {rider.name}
                    </strong>
                    <small className="block mt-1 text-slate-500">
                      {rider.email}
                    </small>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {rider.phone || "No phone added"}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      value={rider.isActive ? "available" : "unavailable"}
                      label={rider.isActive ? "Available" : "Inactive"}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="text"
                      className="min-h-0 px-0 text-xs"
                      onClick={() => onEdit(rider)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {!riders.length && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-12 text-sm text-center text-slate-500"
                  >
                    No delivery people have been added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
        {loading && !initialLoading && <InlineLoadingBar />}
      </section>
    </div>
  );
}
