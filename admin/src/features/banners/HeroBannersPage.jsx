import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { SkeletonLine } from "../../components/ui/LoadingStates";
import StatusBadge from "../../components/ui/StatusBadge";
import { emptyBanner } from "../../constants/admin";
import { dateTime } from "../../utils/format";

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 16);
};

const bannerToForm = (banner) => ({
  ...emptyBanner,
  ...banner,
  displayOrder: String(banner.displayOrder ?? 0),
  startsAt: toDateInput(banner.startsAt),
  endsAt: toDateInput(banner.endsAt),
  isActive: banner.isActive !== false,
});

const Field = ({ label, hint, children, full = false }) => (
  <label className={`grid gap-2 text-sm font-bold text-slate-700 ${full ? "sm:col-span-2" : ""}`}>
    <span>{label}</span>
    {children}
    {hint && <small className="text-[11px] font-semibold leading-5 text-slate-500">{hint}</small>}
  </label>
);

const BannerSkeleton = () => (
  <div className="grid gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr]">
    <SkeletonLine className="h-36 w-full rounded-md" />
    <div className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid flex-1 gap-3">
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-2/3" />
        </div>
        <SkeletonLine className="h-6 w-20" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-10 w-full" />
      </div>
    </div>
  </div>
);

export default function HeroBannersPage({
  banners,
  loading,
  busyAction,
  onSave,
  onDelete,
}) {
  const [editor, setEditor] = useState({ id: null, values: emptyBanner });

  useEffect(() => {
    if (editor.id && !banners.some((banner) => banner._id === editor.id)) {
      setEditor({ id: null, values: emptyBanner });
    }
  }, [banners, editor.id]);

  const values = editor.values;
  const saving = busyAction === "banner-save";

  const update = (changes) =>
    setEditor((current) => ({
      ...current,
      values: { ...current.values, ...changes },
    }));

  const reset = () => setEditor({ id: null, values: emptyBanner });

  const submit = async (event) => {
    event.preventDefault();
    const saved = await onSave(editor.id, values);
    if (saved) reset();
  };

  return (
    <div className="mt-6 grid gap-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_470px]">
        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-5">
            <h2 className="text-base font-extrabold text-slate-900">
              Homepage hero banners
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Active banners appear in the public homepage slider. If no active
              banner exists, the website keeps its original static images.
            </p>
          </div>
          <div className="grid gap-3 p-4">
            {loading && (
              <>
                <BannerSkeleton />
                <BannerSkeleton />
              </>
            )}
            {!loading &&
              banners.map((banner) => {
                const active =
                  banner.isActive !== false &&
                  (!banner.startsAt || new Date(banner.startsAt) <= new Date()) &&
                  (!banner.endsAt || new Date(banner.endsAt) >= new Date());
                return (
                  <div
                    key={banner._id}
                    className="grid gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr]"
                  >
                    <div className="overflow-hidden rounded-md bg-slate-100">
                      <img
                        src={banner.image}
                        alt={banner.title || "Hero banner"}
                        className="h-36 w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-extrabold text-slate-900">
                              {banner.title || "Untitled banner"}
                            </h3>
                            <StatusBadge
                              value={active ? "available" : "unavailable"}
                              label={active ? "Live" : "Hidden"}
                            />
                          </div>
                          {banner.subtitle && (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                              {banner.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-3">
                          <Button
                            variant="text"
                            className="min-h-0 px-0 text-xs"
                            onClick={() =>
                              setEditor({
                                id: banner._id,
                                values: bannerToForm(banner),
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="text"
                            className="min-h-0 px-0 text-xs text-red-700 hover:text-red-800"
                            disabled={busyAction === `banner-${banner._id}`}
                            onClick={() => onDelete(banner)}
                          >
                            {busyAction === `banner-${banner._id}`
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </div>
                      <dl className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                        <div>
                          <dt className="font-extrabold uppercase tracking-wide text-slate-400">
                            Order
                          </dt>
                          <dd className="mt-1 font-bold text-slate-700">
                            {banner.displayOrder || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-extrabold uppercase tracking-wide text-slate-400">
                            Starts
                          </dt>
                          <dd className="mt-1">{dateTime(banner.startsAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-extrabold uppercase tracking-wide text-slate-400">
                            Ends
                          </dt>
                          <dd className="mt-1">{dateTime(banner.endsAt)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                );
              })}
            {!loading && !banners.length && (
              <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                <h3 className="text-sm font-extrabold text-slate-800">
                  No dynamic banners yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Create your first banner to control the homepage hero from
                  admin.
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {editor.id ? "Edit banner" : "Create banner"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Use clear food images with readable title text.
              </p>
            </div>
            {editor.id && (
              <Button variant="secondary" className="min-h-9" onClick={reset}>
                New
              </Button>
            )}
          </div>

          <form className="grid gap-5 p-5" onSubmit={submit}>
            <Field
              label="Image URL"
              hint="Use a wide food image. Recommended ratio: 16:7 or wider."
            >
              <input
                className="field h-11"
                value={values.image}
                onChange={(event) => update({ image: event.target.value })}
                placeholder="https://example.com/banner.webp"
                required
              />
            </Field>
            {values.image && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img
                  src={values.image}
                  alt="Banner preview"
                  className="h-44 w-full object-cover"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Badge" hint="Small red label above title.">
                <input
                  className="field h-11"
                  value={values.badge}
                  onChange={(event) => update({ badge: event.target.value })}
                  placeholder="Fresh deals"
                />
              </Field>
              <Field label="Display order" hint="Lower number shows first.">
                <input
                  className="field h-11"
                  type="number"
                  min="0"
                  value={values.displayOrder}
                  onChange={(event) =>
                    update({ displayOrder: event.target.value })
                  }
                  placeholder="0"
                />
              </Field>
            </div>

            <Field label="Banner title">
              <input
                className="field h-11"
                value={values.title}
                onChange={(event) => update({ title: event.target.value })}
                placeholder="Family Karahi Feast"
              />
            </Field>

            <Field label="Short supporting line">
              <textarea
                className="field min-h-28 resize-none"
                value={values.subtitle}
                onChange={(event) => update({ subtitle: event.target.value })}
                placeholder="Freshly cooked desi favorites delivered hot and fast."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button label">
                <input
                  className="field h-11"
                  value={values.ctaLabel}
                  onChange={(event) => update({ ctaLabel: event.target.value })}
                  placeholder="Order now"
                />
              </Field>
              <Field label="Button link">
                <input
                  className="field h-11"
                  value={values.ctaLink}
                  onChange={(event) => update({ ctaLink: event.target.value })}
                  placeholder="/#popular"
                />
              </Field>
            </div>

            <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
              <span>Show this banner on homepage</span>
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) =>
                    update({ isActive: event.target.checked })
                  }
                  className="h-4 w-4 accent-brand-600"
                />
                Active
              </span>
            </label>

            <div className="grid gap-4">
              <Field
                label="Starts at"
                hint="Leave empty to start immediately."
              >
                <input
                  className="field h-11"
                  type="datetime-local"
                  value={values.startsAt}
                  onChange={(event) => update({ startsAt: event.target.value })}
                />
              </Field>
              <Field
                label="Ends at"
                hint="Leave empty if this banner should not expire."
              >
                <input
                  className="field h-11"
                  type="datetime-local"
                  value={values.endsAt}
                  onChange={(event) => update({ endsAt: event.target.value })}
                />
              </Field>
            </div>
            <Button type="submit" className="min-h-11 w-full" disabled={saving}>
              {saving ? "Saving..." : editor.id ? "Save banner" : "Create banner"}
            </Button>
          </form>
        </article>
      </section>
    </div>
  );
}
