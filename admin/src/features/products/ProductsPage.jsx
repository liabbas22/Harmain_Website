import { useRef } from "react";
import Button from "../../components/ui/Button";
import ProductThumb from "../../components/ui/ProductThumb";
import StatusBadge from "../../components/ui/StatusBadge";
import { money } from "../../utils/format";

export default function ProductsPage({
  products,
  categories,
  query,
  categoryFilter,
  onQueryChange,
  onCategoryFilterChange,
  onNew,
  onEdit,
  onDelete,
  onExport,
  onImport,
  busyAction,
}) {
  const importRef = useRef(null);
  const importing = busyAction === "product-import";
  const exporting = busyAction === "product-export";

  return (
    <div className="mt-6 grid gap-5">
      <section className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <input
            className="field min-w-0 sm:min-w-64"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search products"
          />
          <select
            className="field min-w-0 sm:min-w-44"
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option value={category._id} key={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              onImport?.(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={importing}
            onClick={() => importRef.current?.click()}
          >
            {importing ? "Importing..." : "Import JSON"}
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={exporting}
            onClick={onExport}
          >
            {exporting ? "Exporting..." : "Export JSON"}
          </Button>
          <Button className="w-full sm:w-auto" onClick={onNew}>
            Add product
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <h2 className="text-base font-extrabold text-slate-900">
            Menu catalogue
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {products.length} products match the current filters
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="h-11 border-b border-slate-200 bg-slate-50 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                <th className="px-4">Product</th>
                <th className="px-4">Category</th>
                <th className="px-4">Price</th>
                <th className="px-4">Stock</th>
                <th className="px-4">Menu flags</th>
                <th className="px-4">Availability</th>
                <th className="px-4" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const scheduled =
                  product.availabilitySchedule?.isEnabled === true;
                return (
                  <tr
                    key={product._id}
                    className="border-b border-slate-100 text-sm text-slate-700 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-56 items-center gap-3">
                        <ProductThumb
                          image={product.image}
                          name={product.name}
                          className="h-9 w-9"
                        />
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-slate-800">
                            {product.name}
                          </strong>
                          <small className="mt-1 block max-w-64 truncate text-[11px] text-slate-500">
                            {product.options?.length
                              ? `${product.options.length} price options`
                              : product.description || "No description"}
                            {product.addOns?.length
                              ? ` | ${product.addOns.length} add-ons`
                              : ""}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product.category?.name || "-"}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-slate-800">
                      {money(product.price)}
                    </td>
                    <td
                      className={`px-4 py-3 text-xs font-extrabold ${
                        Number(product.stock) <= 5
                          ? "text-amber-700"
                          : "text-slate-700"
                      }`}
                    >
                      {product.stock}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-64 flex-wrap gap-1.5">
                        {product.isFeatured && (
                          <StatusBadge value="completed" label="Featured" />
                        )}
                        {product.isPopular && (
                          <StatusBadge value="processing" label="Popular" />
                        )}
                        {product.isComboMeal && (
                          <StatusBadge value="paid" label="Combo meal" />
                        )}
                        {scheduled && (
                          <StatusBadge value="pending" label="Timed" />
                        )}
                        {!product.isFeatured &&
                          !product.isPopular &&
                          !product.isComboMeal &&
                          !scheduled && (
                            <span className="text-xs font-bold text-slate-400">
                              Standard
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        value={product.isAvailable ? "available" : "unavailable"}
                        label={product.isAvailable ? "Available" : "Hidden"}
                      />
                      {product.isAvailable &&
                        product.isTimeAvailable === false && (
                          <small className="mt-1 block text-[11px] font-bold text-amber-700">
                            Closed by time
                          </small>
                        )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button
                        variant="text"
                        className="min-h-0 px-0 text-xs"
                        onClick={() => onEdit(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        className="ml-3 min-h-0 px-0 text-xs text-red-700 hover:text-red-800"
                        disabled={busyAction === `product-${product._id}`}
                        onClick={() => onDelete(product)}
                      >
                        {busyAction === `product-${product._id}`
                          ? "Deleting..."
                          : "Delete"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!products.length && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
