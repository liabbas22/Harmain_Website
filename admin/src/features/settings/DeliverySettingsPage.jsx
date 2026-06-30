import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { CardGridSkeleton, SkeletonLine } from "../../components/ui/LoadingStates";
import { money } from "../../utils/format";

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random()}`;
const weekDays = [
  [0, "Sun"],
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
];

const Field = ({ label, hint, children, full = false }) => (
  <label className={`grid gap-2 text-sm font-bold text-slate-700 ${full ? "sm:col-span-2" : ""}`}>
    <span>{label}</span>
    {children}
    {hint && <small className="text-[11px] font-medium leading-5 text-slate-500">{hint}</small>}
  </label>
);

const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
    <span>
      <span className="block text-slate-900">{label}</span>
      {hint && <small className="mt-1 block text-[11px] font-medium text-slate-500">{hint}</small>}
    </span>
    <input className="h-5 w-5 accent-brand-600" checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
  </label>
);

const emptyZone = () => ({
  clientId: newId("zone"),
  name: "New delivery zone",
  areas: "",
  isActive: true,
  deliveryFee: "0",
  minimumOrder: "500",
  freeDeliveryAbove: "0",
  estimatedMinutes: "45",
  note: "",
});

const emptyBranch = () => ({
  clientId: newId("branch"),
  name: "New Branch",
  code: "",
  phone: "",
  address: "",
  city: "Karachi",
  isActive: true,
  openingTime: "11:00",
  closingTime: "23:59",
  openDays: [0, 1, 2, 3, 4, 5, 6],
  zones: [emptyZone()],
});

const zoneToForm = (zone = {}) => ({
  clientId: zone._id || zone.clientId || newId("zone"),
  name: zone.name || "Delivery zone",
  areas: Array.isArray(zone.areas) ? zone.areas.join(", ") : zone.areas || "",
  isActive: zone.isActive !== false,
  deliveryFee: String(zone.deliveryFee ?? 0),
  minimumOrder: String(zone.minimumOrder ?? 500),
  freeDeliveryAbove: String(zone.freeDeliveryAbove ?? 0),
  estimatedMinutes: String(zone.estimatedMinutes ?? 45),
  note: zone.note || "",
});

const branchToForm = (branch = {}) => ({
  clientId: branch._id || branch.clientId || newId("branch"),
  name: branch.name || "Main Branch",
  code: branch.code || "",
  phone: branch.phone || "",
  address: branch.address || "",
  city: branch.city || "Karachi",
  isActive: branch.isActive !== false,
  openingTime: branch.openingTime || "11:00",
  closingTime: branch.closingTime || "23:59",
  openDays: Array.isArray(branch.openDays) && branch.openDays.length ? branch.openDays : [0, 1, 2, 3, 4, 5, 6],
  zones: (branch.zones || []).length ? branch.zones.map(zoneToForm) : [emptyZone()],
});

const toForm = (settings) => ({
  isDeliveryEnabled: settings?.isDeliveryEnabled !== false,
  deliveryFee: String(settings?.deliveryFee ?? 0),
  freeDeliveryAbove: String(settings?.freeDeliveryAbove ?? 0),
  minimumOrder: String(settings?.minimumOrder ?? 500),
  estimatedMinutes: String(settings?.estimatedMinutes ?? 45),
  note: settings?.note || "",
  branches: (settings?.branches || []).length ? settings.branches.map(branchToForm) : [emptyBranch()],
});

const toPayload = (values) => ({
  ...values,
  branches: values.branches.map((branch) => ({
    name: branch.name.trim(),
    code: branch.code.trim(),
    phone: branch.phone.trim(),
    address: branch.address.trim(),
    city: branch.city.trim(),
    isActive: branch.isActive,
    openingTime: branch.openingTime,
    closingTime: branch.closingTime,
    openDays: branch.openDays,
    zones: branch.zones.map((zone) => ({
      name: zone.name.trim(),
      areas: zone.areas.split(",").map((area) => area.trim()).filter(Boolean),
      isActive: zone.isActive,
      deliveryFee: Number(zone.deliveryFee || 0),
      minimumOrder: Number(zone.minimumOrder || 0),
      freeDeliveryAbove: Number(zone.freeDeliveryAbove || 0),
      estimatedMinutes: Number(zone.estimatedMinutes || 0),
      note: zone.note.trim(),
    })),
  })),
});

function DeliverySettingsSkeleton() {
  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonLine className="h-20 w-full sm:col-span-2" />
            <SkeletonLine className="h-20 w-full" />
            <SkeletonLine className="h-20 w-full" />
            <SkeletonLine className="h-20 w-full" />
            <SkeletonLine className="h-20 w-full" />
            <SkeletonLine className="h-20 w-full sm:col-span-2" />
          </div>
          <CardGridSkeleton count={1} className="grid-cols-1" />
        </div>
      </section>
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <SkeletonLine className="h-4 w-48" />
          <SkeletonLine className="mt-2 h-3 w-64" />
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonLine
              key={index}
              className={index === 6 ? "h-16 w-full sm:col-span-2" : "h-16 w-full"}
            />
          ))}
        </div>
      </article>
    </div>
  );
}

export default function DeliverySettingsPage({ settings, loading, onSave, busy }) {
  const [values, setValues] = useState(() => toForm(settings));

  useEffect(() => setValues(toForm(settings)), [settings]);

  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const updateBranch = (index, key, value) =>
    setValues((current) => ({
      ...current,
      branches: current.branches.map((branch, branchIndex) =>
        branchIndex === index ? { ...branch, [key]: value } : branch,
      ),
    }));
  const updateZone = (branchIndex, zoneIndex, key, value) =>
    setValues((current) => ({
      ...current,
      branches: current.branches.map((branch, currentBranchIndex) =>
        currentBranchIndex === branchIndex
          ? {
              ...branch,
              zones: branch.zones.map((zone, currentZoneIndex) =>
                currentZoneIndex === zoneIndex ? { ...zone, [key]: value } : zone,
              ),
            }
          : branch,
      ),
    }));
  const addBranch = () => setValues((current) => ({ ...current, branches: [...current.branches, emptyBranch()] }));
  const removeBranch = (index) =>
    setValues((current) => ({
      ...current,
      branches: current.branches.filter((_, branchIndex) => branchIndex !== index),
    }));
  const addZone = (branchIndex) =>
    setValues((current) => ({
      ...current,
      branches: current.branches.map((branch, index) =>
        index === branchIndex ? { ...branch, zones: [...branch.zones, emptyZone()] } : branch,
      ),
    }));
  const removeZone = (branchIndex, zoneIndex) =>
    setValues((current) => ({
      ...current,
      branches: current.branches.map((branch, index) =>
        index === branchIndex
          ? { ...branch, zones: branch.zones.filter((_, currentZoneIndex) => currentZoneIndex !== zoneIndex) }
          : branch,
      ),
    }));
  const toggleDay = (branchIndex, day) => {
    const branch = values.branches[branchIndex];
    const days = branch.openDays || [];
    updateBranch(
      branchIndex,
      "openDays",
      days.includes(day)
        ? days.filter((entry) => entry !== day)
        : [...days, day].sort((left, right) => left - right),
    );
  };

  const activeBranches = values.branches.filter((branch) => branch.isActive).length;
  const activeZones = values.branches.reduce(
    (sum, branch) => sum + branch.zones.filter((zone) => zone.isActive).length,
    0,
  );
  const firstZone = values.branches.flatMap((branch) => branch.zones)[0] || {};
  const initialLoading = loading && !settings;

  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Delivery & branches</h2>
          <p className="mt-1 text-xs text-slate-500">Manage branches, service zones, area-wise fees, minimum orders, and operating timings.</p>
        </div>
        <div className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold ${values.isDeliveryEnabled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {values.isDeliveryEnabled ? "Delivery enabled" : "Delivery paused"}
        </div>
      </section>

      {initialLoading ? (
        <DeliverySettingsSkeleton />
      ) : (
      <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); onSave(toPayload(values)); }}>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Toggle checked={values.isDeliveryEnabled} onChange={(checked) => update("isDeliveryEnabled", checked)} label="Accept delivery orders" hint="Pause this only when delivery is unavailable for every branch." />
              </div>
              <Field label="Fallback delivery fee" hint="Used only if no zone-specific fee exists.">
                <input className="field" type="number" min="0" step="1" value={values.deliveryFee} onChange={(event) => update("deliveryFee", event.target.value)} required />
              </Field>
              <Field label="Fallback minimum order" hint="Used when a zone does not set its own minimum.">
                <input className="field" type="number" min="0" step="1" value={values.minimumOrder} onChange={(event) => update("minimumOrder", event.target.value)} required />
              </Field>
              <Field label="Fallback free delivery above" hint="Set 0 to disable global free delivery.">
                <input className="field" type="number" min="0" step="1" value={values.freeDeliveryAbove} onChange={(event) => update("freeDeliveryAbove", event.target.value)} required />
              </Field>
              <Field label="Fallback ETA" hint="Shown if no zone-specific ETA is set.">
                <input className="field" type="number" min="0" step="1" value={values.estimatedMinutes} onChange={(event) => update("estimatedMinutes", event.target.value)} required />
              </Field>
              <Field label="Customer note" full hint="Optional short note for checkout context.">
                <input className="field" maxLength="160" value={values.note} onChange={(event) => update("note", event.target.value)} placeholder="Delivery available in selected areas" />
              </Field>
            </div>

            <aside className="rounded-lg border border-red-100 bg-red-50/60 p-4">
              <h3 className="text-sm font-extrabold text-slate-900">Operations summary</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600"><span>Active branches</span><b className="text-slate-900">{activeBranches}</b></div>
                <div className="flex justify-between text-slate-600"><span>Active zones</span><b className="text-slate-900">{activeZones}</b></div>
                <div className="flex justify-between text-slate-600"><span>Sample fee</span><b className="text-slate-900">{money(firstZone.deliveryFee ?? values.deliveryFee)}</b></div>
                <div className="flex justify-between text-slate-600"><span>Sample minimum</span><b className="text-slate-900">{money(firstZone.minimumOrder ?? values.minimumOrder)}</b></div>
              </div>
              <p className="mt-4 rounded-md bg-white px-3 py-2 text-xs leading-5 text-slate-500">
                Orders keep their delivery fee snapshot. Changing zones affects future checkouts only.
              </p>
            </aside>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Branches and delivery zones</h3>
              <p className="mt-1 text-xs text-slate-500">A customer area must match an active zone inside an open branch.</p>
            </div>
            <Button type="button" onClick={addBranch}>Add branch</Button>
          </div>

          {values.branches.map((branch, branchIndex) => (
            <article key={branch.clientId} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{branch.name || `Branch ${branchIndex + 1}`}</h4>
                  <p className="mt-1 text-xs text-slate-500">{branch.city || "Karachi"} | {branch.openingTime} to {branch.closingTime}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
                    <input className="h-4 w-4 accent-brand-600" type="checkbox" checked={branch.isActive} onChange={(event) => updateBranch(branchIndex, "isActive", event.target.checked)} />
                    Active
                  </label>
                  {values.branches.length > 1 && (
                    <Button type="button" variant="text" className="min-h-0 px-0 text-xs text-red-700 hover:text-red-800" onClick={() => removeBranch(branchIndex)}>Remove</Button>
                  )}
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Branch name">
                    <input className="field" value={branch.name} onChange={(event) => updateBranch(branchIndex, "name", event.target.value)} required />
                  </Field>
                  <Field label="Branch code">
                    <input className="field uppercase" value={branch.code} onChange={(event) => updateBranch(branchIndex, "code", event.target.value.toUpperCase())} placeholder="MAIN" />
                  </Field>
                  <Field label="Phone">
                    <input className="field" value={branch.phone} onChange={(event) => updateBranch(branchIndex, "phone", event.target.value)} placeholder="0300..." />
                  </Field>
                  <Field label="City">
                    <input className="field" value={branch.city} onChange={(event) => updateBranch(branchIndex, "city", event.target.value)} required />
                  </Field>
                  <Field label="Opening time">
                    <input className="field" type="time" value={branch.openingTime} onChange={(event) => updateBranch(branchIndex, "openingTime", event.target.value)} required />
                  </Field>
                  <Field label="Closing time">
                    <input className="field" type="time" value={branch.closingTime} onChange={(event) => updateBranch(branchIndex, "closingTime", event.target.value)} required />
                  </Field>
                  <Field label="Branch address" full>
                    <input className="field" value={branch.address} onChange={(event) => updateBranch(branchIndex, "address", event.target.value)} placeholder="Complete branch address" />
                  </Field>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <span className="mb-2 block text-sm font-bold text-slate-700">Open days</span>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map(([day, label]) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(branchIndex, day)}
                          className={`rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${branch.openDays.includes(day) ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:ring-red-200"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-extrabold text-slate-900">Delivery zones</h5>
                    <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => addZone(branchIndex)}>Add zone</Button>
                  </div>
                  {branch.zones.map((zone, zoneIndex) => (
                    <div key={zone.clientId} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <b className="text-sm text-slate-900">{zone.name || `Zone ${zoneIndex + 1}`}</b>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
                            <input className="h-4 w-4 accent-brand-600" type="checkbox" checked={zone.isActive} onChange={(event) => updateZone(branchIndex, zoneIndex, "isActive", event.target.checked)} />
                            Active
                          </label>
                          {branch.zones.length > 1 && (
                            <Button type="button" variant="text" className="min-h-0 px-0 text-xs text-red-700 hover:text-red-800" onClick={() => removeZone(branchIndex, zoneIndex)}>Remove</Button>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Zone name">
                          <input className="field" value={zone.name} onChange={(event) => updateZone(branchIndex, zoneIndex, "name", event.target.value)} required />
                        </Field>
                        <Field label="Delivery fee">
                          <input className="field" type="number" min="0" step="1" value={zone.deliveryFee} onChange={(event) => updateZone(branchIndex, zoneIndex, "deliveryFee", event.target.value)} required />
                        </Field>
                        <Field label="Minimum order">
                          <input className="field" type="number" min="0" step="1" value={zone.minimumOrder} onChange={(event) => updateZone(branchIndex, zoneIndex, "minimumOrder", event.target.value)} required />
                        </Field>
                        <Field label="ETA minutes">
                          <input className="field" type="number" min="0" step="1" value={zone.estimatedMinutes} onChange={(event) => updateZone(branchIndex, zoneIndex, "estimatedMinutes", event.target.value)} required />
                        </Field>
                        <Field label="Free delivery above">
                          <input className="field" type="number" min="0" step="1" value={zone.freeDeliveryAbove} onChange={(event) => updateZone(branchIndex, zoneIndex, "freeDeliveryAbove", event.target.value)} />
                        </Field>
                        <Field label="Zone note">
                          <input className="field" maxLength="160" value={zone.note} onChange={(event) => updateZone(branchIndex, zoneIndex, "note", event.target.value)} placeholder="Optional" />
                        </Field>
                        <Field label="Areas" full hint="Comma separated. Example: Bahadurabad, Gulshan, Clifton. Leave empty only for a catch-all zone.">
                          <textarea className="field min-h-20 py-3" value={zone.areas} onChange={(event) => updateZone(branchIndex, zoneIndex, "areas", event.target.value)} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </article>
          ))}
        </section>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-100/95 py-4 backdrop-blur">
          <span className="text-xs text-slate-500">{loading ? "Loading settings..." : settings?.updatedAt ? `Last updated ${new Date(settings.updatedAt).toLocaleString()}` : "Ready to save"}</span>
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save delivery settings"}</Button>
        </div>
      </form>
      )}
    </div>
  );
}
