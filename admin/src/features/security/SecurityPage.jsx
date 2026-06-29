import { useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import {
  ADMIN_PERMISSION_LABELS,
  ADMIN_ROLE_OPTIONS,
} from "../../constants/admin";

const roleLabel = (role) =>
  ADMIN_ROLE_OPTIONS.find(([value]) => value === role)?.[1] || "Admin";

const formatDate = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const permissionOptions = Object.entries(ADMIN_PERMISSION_LABELS).filter(
  ([permission]) => permission !== "*",
);

function PermissionChips({ permissions = [] }) {
  const visiblePermissions = permissions.includes("*")
    ? [["*", ADMIN_PERMISSION_LABELS["*"]]]
    : permissionOptions.filter(([permission]) => permissions.includes(permission));

  if (!visiblePermissions.length)
    return <span className="text-sm font-bold text-slate-500">No extra permissions</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {visiblePermissions.map(([permission, label]) => (
        <span
          key={permission}
          className="rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-brand-700"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function PermissionChecklist({ value = [], onChange }) {
  const selected = new Set(value);
  const togglePermission = (permission) => {
    const next = new Set(selected);
    if (next.has(permission)) next.delete(permission);
    else next.add(permission);
    onChange([...next]);
  };

  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
      {permissionOptions.map(([permission, label]) => (
        <label
          key={permission}
          className="flex items-start gap-2 text-xs font-bold text-slate-600"
        >
          <input
            type="checkbox"
            className="mt-0.5 accent-brand-600"
            checked={selected.has(permission)}
            onChange={() => togglePermission(permission)}
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

export default function SecurityPage({
  session,
  admins,
  activity,
  emptyAdmin,
  loading,
  error,
  busyAction,
  canManageSecurity,
  onRefresh,
  onCreateAdmin,
  onUpdateAdmin,
  onChangePassword,
  onLogoutAllSessions,
}) {
  const [newAdmin, setNewAdmin] = useState(emptyAdmin);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [drafts, setDrafts] = useState({});
  const [formError, setFormError] = useState("");

  const activeAdmins = useMemo(
    () => admins.filter((admin) => admin.isActive !== false).length,
    [admins],
  );

  const updateDraft = (admin, changes) => {
    const adminId = admin._id || admin.id;
    setDrafts((current) => ({
      ...current,
      [adminId]: {
        name: admin.name || "",
        phone: admin.phone || "",
        adminRole: admin.adminRole || "manager",
        isActive: admin.isActive !== false,
        permissions: admin.customPermissions || [],
        ...(current[adminId] || {}),
        ...changes,
      },
    }));
  };

  const draftFor = (admin) => {
    const adminId = admin._id || admin.id;
    return {
      name: admin.name || "",
      phone: admin.phone || "",
      adminRole: admin.adminRole || "manager",
      isActive: admin.isActive !== false,
      permissions: admin.customPermissions || [],
      ...(drafts[adminId] || {}),
    };
  };

  const submitNewAdmin = async (event) => {
    event.preventDefault();
    setFormError("");
    if (newAdmin.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    const saved = await onCreateAdmin({
      ...newAdmin,
      name: newAdmin.name.trim(),
      email: newAdmin.email.trim(),
      phone: newAdmin.phone.trim(),
    });
    if (saved) setNewAdmin(emptyAdmin);
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setFormError("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormError("New password and confirmation do not match.");
      return;
    }
    const saved = await onChangePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    if (saved)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <section className="grid gap-6 pt-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-brand-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
            Current access
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            {roleLabel(session.user?.adminRole)}
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {session.user?.name} - {session.user?.email}
          </p>
          <div className="mt-4">
            <PermissionChips permissions={session.user?.permissions || []} />
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
            Admin accounts
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            {canManageSecurity ? activeAdmins : "Protected"}
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {canManageSecurity
              ? `${admins.length} total admin profiles`
              : "Only owner admins can manage admin users."}
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
            Session security
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            Token versioned
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Password changes and logout-all invalidate old tokens.
          </p>
        </article>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <form
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          onSubmit={submitPassword}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
                Password
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                Change password
              </h2>
            </div>
            <Button
              variant="secondary"
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
          <div className="grid gap-5 p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                Current password
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                New password
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                Confirm password
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  required
                />
              </label>
            </div>
            {formError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-brand-700">
                {formError}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                type="submit"
                className="min-h-10 px-4"
                disabled={busyAction === "admin-password-change"}
              >
                {busyAction === "admin-password-change" ? "Saving..." : "Change password"}
              </Button>
              <Button
                variant="danger"
                className="min-h-10 px-4"
                onClick={onLogoutAllSessions}
                disabled={busyAction === "admin-logout-all"}
              >
                {busyAction === "admin-logout-all" ? "Signing out..." : "Sign out all sessions"}
              </Button>
            </div>
          </div>
        </form>

        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
              Role guide
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              Access levels
            </h2>
          </div>
          <div className="max-h-[270px] overflow-y-auto p-5">
            <div className="grid gap-3 pr-1">
              {ADMIN_ROLE_OPTIONS.map(([role, label]) => (
                <div key={role} className="rounded-md border border-slate-200 p-3">
                  <strong className="text-sm text-slate-900">{label}</strong>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                    {role === "owner"
                      ? "Full security, settings, menu, order, report and staff access."
                      : role === "manager"
                        ? "Operational access without admin security management."
                        : "Order dashboard, order details and status operations only."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {canManageSecurity && (
        <form
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={submitNewAdmin}
        >
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
              Owner controls
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              Create admin user
            </h2>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {[
              ["name", "Full name", "text"],
              ["email", "Email address", "email"],
              ["phone", "Phone", "text"],
              ["password", "Temporary password", "password"],
            ].map(([field, label, type]) => (
              <label key={field} className="grid gap-2 text-sm font-bold text-slate-700">
                {label}
                <input
                  className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                  type={type}
                  value={newAdmin[field]}
                  onChange={(event) =>
                    setNewAdmin((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  required={field !== "phone"}
                />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Admin role
              <select
                className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                value={newAdmin.adminRole}
                onChange={(event) =>
                  setNewAdmin((current) => ({
                    ...current,
                    adminRole: event.target.value,
                  }))
                }
              >
                {ADMIN_ROLE_OPTIONS.map(([role, label]) => (
                  <option key={role} value={role}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={newAdmin.isActive}
                onChange={(event) =>
                  setNewAdmin((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active account
            </label>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Extra permissions
            </p>
            <PermissionChecklist
              value={newAdmin.permissions}
              onChange={(permissions) =>
                setNewAdmin((current) => ({ ...current, permissions }))
              }
            />
          </div>
          <div className="mt-5">
            <Button type="submit" disabled={busyAction === "admin-user-create"}>
              {busyAction === "admin-user-create" ? "Creating..." : "Create admin"}
            </Button>
          </div>
        </form>
      )}

      {canManageSecurity && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
                Admin users
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                Roles and permissions
              </h2>
            </div>
            <Button variant="secondary" onClick={onRefresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="mt-5 grid gap-4">
            {admins.map((admin) => {
              const adminId = admin._id || admin.id;
              const draft = draftFor(admin);
              const isSelf = adminId === session.user?.id;
              return (
                <article
                  key={adminId}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_150px_130px_auto] lg:items-end">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Admin profile
                      <input
                        className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                        value={draft.name}
                        onChange={(event) => updateDraft(admin, { name: event.target.value })}
                      />
                      <span className="text-xs font-bold text-slate-500">
                        {admin.email}
                      </span>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Role
                      <select
                        className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                        value={draft.adminRole}
                        disabled={isSelf}
                        onChange={(event) =>
                          updateDraft(admin, { adminRole: event.target.value })
                        }
                      >
                        {ADMIN_ROLE_OPTIONS.map(([role, label]) => (
                          <option key={role} value={role}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Status
                      <select
                        className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                        value={draft.isActive ? "active" : "inactive"}
                        disabled={isSelf}
                        onChange={(event) =>
                          updateDraft(admin, {
                            isActive: event.target.value === "active",
                          })
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </label>
                    <Button
                      onClick={() =>
                        onUpdateAdmin(adminId, {
                          name: draft.name.trim(),
                          phone: draft.phone.trim(),
                          ...(!isSelf
                            ? {
                                adminRole: draft.adminRole,
                                isActive: draft.isActive,
                              }
                            : {}),
                          permissions: draft.permissions,
                        })
                      }
                      disabled={busyAction === `admin-user-${adminId}`}
                    >
                      {busyAction === `admin-user-${adminId}` ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Phone
                      <input
                        className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100"
                        value={draft.phone}
                        onChange={(event) => updateDraft(admin, { phone: event.target.value })}
                      />
                    </label>
                    <div>
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Effective permissions
                      </p>
                      <PermissionChips permissions={admin.permissions || []} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Extra permissions
                    </p>
                    <PermissionChecklist
                      value={draft.permissions}
                      onChange={(permissions) => updateDraft(admin, { permissions })}
                    />
                  </div>
                  <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-3">
                    <span>Last login: {formatDate(admin.lastLoginAt)}</span>
                    <span>Password changed: {formatDate(admin.passwordChangedAt)}</span>
                    <span>Created: {formatDate(admin.createdAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {canManageSecurity && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
              Activity log
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              Recent admin actions
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Showing recent actions only. Older records are automatically removed after 90 days.
            </p>
          </div>
          <div className="mt-5 max-h-[440px] overflow-y-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activity.map((log) => (
                  <tr key={log._id}>
                    <td className="px-4 py-3">
                      <strong className="block text-slate-900">
                        {log.adminName || "Admin"}
                      </strong>
                      <span className="text-xs font-bold text-slate-500">
                        {log.adminEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.entity}
                      {log.entityId ? ` #${String(log.entityId).slice(-6)}` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
                {!activity.length && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-sm font-bold text-slate-500">
                      No admin activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
