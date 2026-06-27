import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

const makeOption = () => ({
  clientId: `${Date.now()}-${Math.random()}`,
  name: "",
  actualPrice: "",
  discountPrice: "",
  tag: "",
});
const makeAddOn = () => ({
  clientId: `${Date.now()}-${Math.random()}-addon`,
  name: "",
  price: "",
  isAvailable: true,
});
const weekDays = [
  [0, "Sun"],
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
];

export default function ProductEditor({
  editor,
  categories,
  products = [],
  onChange,
  onClose,
  onSave,
  busy,
}) {
  const { values } = editor;
  const schedule = values.availabilitySchedule || {};
  const update = (key, value) =>
    onChange({ ...editor, values: { ...values, [key]: value } });
  const updateSchedule = (key, value) =>
    update("availabilitySchedule", { ...schedule, [key]: value });
  const updateOption = (index, key, value) =>
    update(
      "options",
      values.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [key]: value } : option,
      ),
    );
  const removeOption = (index) =>
    update(
      "options",
      values.options.filter((_, optionIndex) => optionIndex !== index),
    );
  const updateAddOn = (index, key, value) =>
    update(
      "addOns",
      values.addOns.map((addOn, addOnIndex) =>
        addOnIndex === index ? { ...addOn, [key]: value } : addOn,
      ),
    );
  const removeAddOn = (index) =>
    update(
      "addOns",
      values.addOns.filter((_, addOnIndex) => addOnIndex !== index),
    );
  const comboItems = values.comboItems || [];
  const selectedComboProductIds = new Set(
    comboItems.map((item) => String(item.product)),
  );
  const availableComboProducts = products.filter(
    (product) =>
      product._id !== editor.id && !selectedComboProductIds.has(product._id),
  );
  const addComboItem = (productId) => {
    const product = products.find((entry) => entry._id === productId);
    if (!product) return;
    update("comboItems", [
      ...comboItems,
      {
        clientId: `${Date.now()}-${Math.random()}-combo`,
        product: product._id,
        quantity: "1",
        label: product.name,
        optionName: product.options?.[0]?.name || "",
      },
    ]);
  };
  const updateComboItem = (index, key, value) =>
    update(
      "comboItems",
      comboItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  const removeComboItem = (index) =>
    update(
      "comboItems",
      comboItems.filter((_, itemIndex) => itemIndex !== index),
    );
  const comboProductName = (comboItem) => {
    if (comboItem.label) return comboItem.label;
    const product = products.find((entry) => entry._id === comboItem.product);
    return product?.name || "Selected product";
  };
  const comboProductOptions = (comboItem) => {
    const product = products.find((entry) => entry._id === comboItem.product);
    return Array.isArray(product?.options) ? product.options : [];
  };
  const toggleDay = (day) => {
    const days = schedule.days || [];
    updateSchedule(
      "days",
      days.includes(day)
        ? days.filter((entry) => entry !== day)
        : [...days, day].sort((left, right) => left - right),
    );
  };

  return (
    <Modal title={editor.id ? "Edit product" : "Add product"} onClose={onClose}>
      <form className="p-4 sm:p-6" onSubmit={onSave}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name">
            <input
              className="field"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </Field>
          <Field label="Category">
            <select
              className="field"
              value={values.category}
              onChange={(event) => update("category", event.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stock units">
            <input
              className="field"
              min="0"
              type="number"
              value={values.stock}
              onChange={(event) => update("stock", event.target.value)}
              required
            />
          </Field>
          <Field label="Display order">
            <input
              className="field"
              type="number"
              value={values.displayOrder}
              onChange={(event) => update("displayOrder", event.target.value)}
            />
          </Field>
          <Field label="Image URL" full>
            <input
              className="field"
              type="url"
              value={values.image}
              onChange={(event) => update("image", event.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Description" full>
            <textarea
              className="field"
              rows="3"
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>
          <Field label="Tags" full>
            <input
              className="field"
              value={values.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="popular, spicy, pizza"
            />
          </Field>
          <div className="col-span-full grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Toggle
              checked={values.isAvailable}
              onChange={(checked) => update("isAvailable", checked)}
              label="Show to customers"
            />
            <Toggle
              checked={values.isFeatured}
              onChange={(checked) => update("isFeatured", checked)}
              label="Featured product"
            />
            <Toggle
              checked={values.isPopular}
              onChange={(checked) => update("isPopular", checked)}
              label="Popular product"
            />
            <Toggle
              checked={values.isComboMeal}
              onChange={(checked) =>
                onChange({
                  ...editor,
                  values: {
                    ...values,
                    isComboMeal: checked,
                    comboItems: checked ? comboItems : [],
                  },
                })
              }
              label="Combo meal"
            />
          </div>
        </div>

        {values.isComboMeal && (
          <section className="mt-7 border-t border-slate-200 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Combo includes
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Select the products included inside this combo meal.
                </p>
              </div>
              <select
                className="field min-w-56"
                value=""
                onChange={(event) => addComboItem(event.target.value)}
              >
                <option value="">Add product to combo</option>
                {availableComboProducts.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 grid gap-2">
              {comboItems.map((item, index) => {
                const optionList = comboProductOptions(item);
                return (
                  <div
                    key={item._id || item.clientId || `${item.product}-${index}`}
                    className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_150px_110px_auto]"
                  >
                    <div className="min-w-0">
                      <b className="block truncate text-sm text-slate-800">
                        {comboProductName(item)}
                      </b>
                      <small className="mt-1 block truncate text-[11px] text-slate-500">
                        Combo item
                      </small>
                    </div>
                    {optionList.length > 0 ? (
                      <select
                        className="field"
                        value={item.optionName || optionList[0]?.name || ""}
                        onChange={(event) =>
                          updateComboItem(index, "optionName", event.target.value)
                        }
                        aria-label={`${comboProductName(item)} option`}
                      >
                        {optionList.map((option) => (
                          <option
                            key={option._id || option.name}
                            value={option.name}
                          >
                            {option.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input className="field" value="Regular" disabled />
                    )}
                    <input
                      className="field"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateComboItem(index, "quantity", event.target.value)
                      }
                      placeholder="Qty"
                    />
                    <Button
                      variant="text"
                      className="px-1 text-xs text-red-700 hover:text-red-800"
                      onClick={() => removeComboItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
              {!comboItems.length && (
                <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Select products from the dropdown to build this combo.
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mt-7 border-t border-slate-200 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Product availability by time
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Leave disabled for all-day availability.
              </p>
            </div>
            <Toggle
              checked={schedule.isEnabled === true}
              onChange={(checked) => updateSchedule("isEnabled", checked)}
              label="Use schedule"
            />
          </div>
          {schedule.isEnabled && (
            <div className="mt-4 grid gap-4 rounded-md bg-slate-50 p-4 sm:grid-cols-2">
              <Field label="Start time">
                <input
                  className="field"
                  type="time"
                  value={schedule.startTime || ""}
                  onChange={(event) =>
                    updateSchedule("startTime", event.target.value)
                  }
                />
              </Field>
              <Field label="End time">
                <input
                  className="field"
                  type="time"
                  value={schedule.endTime || ""}
                  onChange={(event) =>
                    updateSchedule("endTime", event.target.value)
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Available days
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {weekDays.map(([day, label]) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`min-h-9 rounded-md px-3 text-xs font-extrabold transition ${
                        (schedule.days || []).includes(day)
                          ? "bg-brand-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <small className="mt-2 block text-xs text-slate-500">
                  If no day is selected, every day is allowed.
                </small>
              </div>
              <Field label="Unavailable message" full>
                <input
                  className="field"
                  value={schedule.message || ""}
                  onChange={(event) =>
                    updateSchedule("message", event.target.value)
                  }
                  placeholder="Available after 6 PM"
                />
              </Field>
            </div>
          )}
        </section>

        <section className="mt-7 border-t border-slate-200 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Add-ons
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Add extras such as cheese, drinks, sauces or fries.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => update("addOns", [...values.addOns, makeAddOn()])}
            >
              Add add-on
            </Button>
          </div>
          <div className="mt-4 grid gap-2">
            {values.addOns.map((addOn, index) => (
              <div
                className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-[1fr_130px_120px_auto]"
                key={addOn._id || addOn.clientId || index}
              >
                <input
                  className="field"
                  value={addOn.name}
                  onChange={(event) =>
                    updateAddOn(index, "name", event.target.value)
                  }
                  placeholder="Extra cheese"
                />
                <input
                  className="field"
                  value={addOn.price}
                  onChange={(event) =>
                    updateAddOn(index, "price", event.target.value)
                  }
                  type="number"
                  min="0"
                  placeholder="Price"
                />
                <Toggle
                  checked={addOn.isAvailable !== false}
                  onChange={(checked) =>
                    updateAddOn(index, "isAvailable", checked)
                  }
                  label="Available"
                />
                <Button
                  variant="text"
                  className="px-1 text-xs text-red-700 hover:text-red-800"
                  onClick={() => removeAddOn(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            {!values.addOns.length && (
              <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No add-ons for this product.
              </p>
            )}
          </div>
        </section>

        <section className="mt-7 border-t border-slate-200 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Size and price options
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Add at least one priced option for a new product.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => update("options", [...values.options, makeOption()])}
            >
              Add option
            </Button>
          </div>
          <div className="mt-4 grid gap-2">
            {values.options.map((option, index) => (
              <div
                className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
                key={option._id || option.clientId || index}
              >
                <input
                  className="field"
                  value={option.name}
                  onChange={(event) =>
                    updateOption(index, "name", event.target.value)
                  }
                  placeholder="Size"
                />
                <input
                  className="field"
                  value={option.actualPrice}
                  onChange={(event) =>
                    updateOption(index, "actualPrice", event.target.value)
                  }
                  type="number"
                  min="0"
                  placeholder="Actual price"
                />
                <input
                  className="field"
                  value={option.discountPrice}
                  onChange={(event) =>
                    updateOption(index, "discountPrice", event.target.value)
                  }
                  type="number"
                  min="0"
                  placeholder="Sale price"
                />
                <input
                  className="field"
                  value={option.tag}
                  onChange={(event) =>
                    updateOption(index, "tag", event.target.value)
                  }
                  placeholder="Tag"
                />
                <Button
                  variant="text"
                  className="px-1 text-xs text-red-700 hover:text-red-800"
                  onClick={() => removeOption(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-7 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
      <input
        className="h-4 w-4 accent-brand-600"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function Field({ label, children, full = false }) {
  return (
    <label
      className={`grid gap-2 text-sm font-bold text-slate-700 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}
