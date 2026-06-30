import Button from "../../components/ui/Button";
import {
  CardGridSkeleton,
  InlineLoadingBar,
} from "../../components/ui/LoadingStates";
import ProductThumb from "../../components/ui/ProductThumb";
import StatusBadge from "../../components/ui/StatusBadge";
import { productCategoryId } from "../../utils/format";

export default function CategoriesPage({
  categories,
  products,
  loading,
  onNew,
  onEdit,
  onDelete,
  busyAction,
}) {
  const initialLoading = loading && !categories.length;

  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Menu categories
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organise customer-facing menu groups.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={onNew}>
          Add category
        </Button>
      </section>

      <section className="relative">
        {initialLoading ? (
          <CardGridSkeleton count={6} className="sm:grid-cols-2 xl:grid-cols-3" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const count = products.filter(
                (product) => productCategoryId(product) === category._id,
              ).length;

              return (
                <article
                  className="flex min-h-56 flex-col rounded-lg border border-slate-200 bg-white p-4"
                  key={category._id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <ProductThumb
                      image={category.image}
                      name={category.name}
                      className="h-12 w-12 rounded-lg"
                    />
                    <StatusBadge
                      value={category.isActive ? "available" : "unavailable"}
                      label={category.isActive ? "Active" : "Inactive"}
                    />
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-slate-900">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-slate-500">
                    {category.description || "No category description."}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs font-extrabold text-slate-500">
                      {count} products
                    </span>
                    <div>
                      <Button
                        variant="text"
                        className="min-h-0 px-0 text-xs"
                        onClick={() => onEdit(category)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        className="ml-3 min-h-0 px-0 text-xs text-red-700 hover:text-red-800"
                        disabled={busyAction === `category-${category._id}`}
                        onClick={() => onDelete(category)}
                      >
                        {busyAction === `category-${category._id}`
                          ? "Deleting..."
                          : "Delete"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
            {!categories.length && (
              <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                No categories have been created yet.
              </div>
            )}
          </div>
        )}
        {loading && !initialLoading && <InlineLoadingBar />}
      </section>
    </div>
  );
}
