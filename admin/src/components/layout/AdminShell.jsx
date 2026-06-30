import { ADMIN_ROLE_OPTIONS, hasAdminPermission, navigationItems } from "../../constants/admin";
import Button from "../ui/Button";

export default function AdminShell({
  session,
  view,
  onViewChange,
  onLogout,
  loading,
  onRefresh,
  newOrderCount = 0,
  newFeedbackCount = 0,
  realtimeConnected = false,
  children,
}) {
  const viewLabel =
    navigationItems.find(([id]) => id === view)?.[1] ||
    view
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  const allowedNavigation = navigationItems.filter(([, , permission]) =>
    hasAdminPermission(session.user, permission),
  );
  const roleLabel =
    ADMIN_ROLE_OPTIONS.find(([role]) => role === session.user?.adminRole)?.[1] ||
    "Admin";

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="bg-[#191c21] p-3 text-slate-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-5">
        <div className="flex items-center gap-3 px-2 pb-3 lg:pb-7">
          <span className="grid text-xs font-extrabold text-white rounded-md h-9 w-9 place-items-center bg-brand-600">
            HS
          </span>
          <span className="text-sm font-extrabold text-white">
            Harmain Admin
          </span>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto pb-3 lg:min-h-0 lg:flex-1 lg:auto-rows-max lg:grid lg:overflow-x-hidden lg:overflow-y-auto lg:pb-6 lg:pr-1"
          aria-label="Admin navigation"
        >
          {allowedNavigation.map(([id, label]) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`flex min-h-10 shrink-0 items-center justify-between gap-3 rounded-md px-3 text-left text-sm font-bold transition ${view === id ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <span>{label}</span>
              {id === "orders" && newOrderCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-extrabold text-brand-700">{newOrderCount > 99 ? "99+" : newOrderCount}</span>}
              {id === "feedback" && newFeedbackCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-extrabold text-brand-700">{newFeedbackCount > 99 ? "99+" : newFeedbackCount}</span>}
            </button>
          ))}
        </nav>
        <div className="flex items-center justify-between px-2 pt-3 mt-3 border-t border-slate-700 lg:hidden">
          <span className="pr-3 text-xs font-bold truncate text-slate-300">
            {session.user?.name || "Administrator"} - {roleLabel}
          </span>
          <Button
            variant="danger"
            className="px-3 text-xs min-h-8 shrink-0"
            onClick={onLogout}
          >
            Sign out
          </Button>
        </div>
        <div className="mt-auto hidden border-t border-slate-700 px-2 pt-5 lg:grid lg:grid-cols-[34px_1fr] lg:gap-3">
          <span className="grid text-xs font-extrabold text-white rounded-full h-9 w-9 place-items-center bg-brand-600">
            {session.user?.name?.slice(0, 1).toUpperCase() || "A"}
          </span>
          <div className="min-w-0">
            <strong className="block text-xs text-white truncate">
              {session.user?.name || "Administrator"}
            </strong>
            <small className="mt-1 block truncate text-[10px] text-slate-400">
              {session.user?.email}
            </small>
            <small className="mt-1 block text-[10px] font-extrabold uppercase tracking-wide text-red-200">
              {roleLabel}
            </small>
          </div>
          <Button
            variant="text"
            className="col-span-2 px-0 py-0 text-xs text-red-200 justify-self-start hover:text-red-100"
            onClick={onLogout}
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main className="min-w-0 px-4 pt-6 pb-10 sm:px-6 lg:px-12 lg:pb-14 lg:pt-8">
        <header className="flex flex-col gap-4 pb-6 border-b border-slate-200 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
              Operations
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              {viewLabel}
            </h1>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className={`inline-flex items-center gap-2 text-xs font-extrabold before:h-2 before:w-2 before:rounded-full ${realtimeConnected ? "text-emerald-700 before:bg-emerald-600" : "text-slate-500 before:bg-slate-400"}`}>
              {realtimeConnected ? "Live notifications" : "Notifications reconnecting"}
            </span>
            <Button variant="secondary" onClick={onRefresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
