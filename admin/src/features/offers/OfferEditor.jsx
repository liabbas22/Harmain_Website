import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

const Field = ({ label, children, full = false, hint }) => (
  <label className={`grid gap-2 text-sm font-bold text-slate-700 ${full ? "sm:col-span-2" : ""}`}>
    <span>{label}</span>
    {children}
    {hint && <small className="text-[11px] font-medium leading-5 text-slate-500">{hint}</small>}
  </label>
);

const dealTypes = [
  ["discount", "Discount"],
  ["buy_x_get_y", "Buy X Get Y"],
  ["combo", "Combo deal"],
];

export default function OfferEditor({ editor, categories, products, onChange, onClose, onSave, busy }) {
  const { values } = editor;
  const update = (key, value) => onChange({ ...editor, values: { ...values, [key]: value } });
  const updateProducts = (event) => update("products", [...event.target.selectedOptions].map((option) => option.value));
  const updateDealType = (dealType) => {
    onChange({
      ...editor,
      values: {
        ...values,
        dealType,
        appliesTo: dealType === "combo" || (dealType === "buy_x_get_y" && values.appliesTo === "order") ? "products" : values.appliesTo,
      },
    });
  };
  const isDiscount = values.dealType === "discount";
  const isBuyGet = values.dealType === "buy_x_get_y";
  const isCombo = values.dealType === "combo";

  return (
    <Modal title={editor.id ? "Edit automatic offer" : "Create automatic offer"} onClose={onClose} size="max-w-3xl">
      <form className="p-4 sm:p-6" onSubmit={onSave}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Offer name">
            <input className="field" value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="Pizza Friday" required />
          </Field>

          <Field label="Deal type">
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {dealTypes.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateDealType(value)}
                  className={`rounded-md px-2 py-2 text-xs font-extrabold transition ${values.dealType === value ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {isDiscount && (
            <>
              <Field label="Discount type">
                <select className="field" value={values.discountType} onChange={(event) => update("discountType", event.target.value)}>
                  <option value="percentage">Percentage discount</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </Field>
              <Field label={values.discountType === "percentage" ? "Discount percentage" : "Discount amount"}>
                <input className="field" type="number" min="0.01" max={values.discountType === "percentage" ? "100" : undefined} step="0.01" value={values.value} onChange={(event) => update("value", event.target.value)} required />
              </Field>
            </>
          )}

          {isBuyGet && (
            <>
              <Field label="Buy quantity">
                <input className="field" type="number" min="1" step="1" value={values.buyQuantity} onChange={(event) => update("buyQuantity", event.target.value)} required />
              </Field>
              <Field label="Free quantity">
                <input className="field" type="number" min="1" step="1" value={values.getQuantity} onChange={(event) => update("getQuantity", event.target.value)} required />
              </Field>
            </>
          )}

          {isCombo && (
            <Field label="Combo price" hint="Customer pays this price when all selected products are in the cart.">
              <input className="field" type="number" min="0.01" step="0.01" value={values.comboPrice} onChange={(event) => update("comboPrice", event.target.value)} required />
            </Field>
          )}

          {!isCombo && (
            <Field label="Apply offer to">
              <select className="field" value={values.appliesTo} onChange={(event) => update("appliesTo", event.target.value)}>
                {isDiscount && <option value="order">Whole order</option>}
                <option value="category">One category</option>
                <option value="products">Selected products</option>
              </select>
            </Field>
          )}

          {!isCombo && values.appliesTo === "category" && (
            <Field label="Category" full>
              <select className="field" value={values.category} onChange={(event) => update("category", event.target.value)} required>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </Field>
          )}

          {(isCombo || values.appliesTo === "products") && (
            <Field label={isCombo ? "Combo products" : "Products"} full hint={isCombo ? "Select at least two products. Each combo uses one unit from every selected product." : "Hold Ctrl or Command to select more than one product."}>
              <select className="field min-h-32" multiple value={values.products} onChange={updateProducts} required>
                {products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
              </select>
            </Field>
          )}

          <Field label="Minimum order amount">
            <input className="field" type="number" min="0" step="1" value={values.minimumOrder} onChange={(event) => update("minimumOrder", event.target.value)} required />
          </Field>

          {isDiscount && values.discountType === "percentage" && (
            <Field label="Maximum discount" hint="Leave empty for no cap.">
              <input className="field" type="number" min="0.01" step="0.01" value={values.maxDiscount} onChange={(event) => update("maxDiscount", event.target.value)} />
            </Field>
          )}

          <Field label="Offer priority" hint="Used only when savings are equal.">
            <input className="field" type="number" min="0" step="1" value={values.priority} onChange={(event) => update("priority", event.target.value)} required />
          </Field>
          <Field label="Starts at">
            <input className="field" type="datetime-local" value={values.startsAt} onChange={(event) => update("startsAt", event.target.value)} required />
          </Field>
          <Field label="Expires at" hint="Leave empty for no expiry.">
            <input className="field" type="datetime-local" value={values.expiresAt} onChange={(event) => update("expiresAt", event.target.value)} />
          </Field>
          <Field label="Internal description" full>
            <textarea className="field" rows="3" value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Shown only in the admin workspace." maxLength="160" />
          </Field>
          <label className="col-span-full flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700">
            <input className="h-4 w-4 accent-brand-600" checked={values.isActive} onChange={(event) => update("isActive", event.target.checked)} type="checkbox" />
            Enable this automatic offer
          </label>
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save offer"}</Button>
        </div>
      </form>
    </Modal>
  );
}
