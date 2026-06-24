import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

export default function RiderEditor({
  editor,
  onChange,
  onClose,
  onSave,
  busy,
}) {
  const update = (key, value) =>
    onChange({ ...editor, values: { ...editor.values, [key]: value } });
  const isNew = !editor.id;

  return (
    <Modal
      title={isNew ? "Add delivery person" : "Edit delivery person"}
      onClose={onClose}
      size="max-w-2xl"
    >
      <form className="p-4 sm:p-6" onSubmit={onSave}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className="field"
              value={editor.values.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </Field>
          <Field label="Phone number">
            <input
              className="field"
              value={editor.values.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="03XX XXXXXXX"
              required={isNew}
            />
          </Field>
          <Field label="Email address" full={!isNew}>
            <input
              className="field"
              type="email"
              value={editor.values.email}
              onChange={(event) => update("email", event.target.value)}
              disabled={!isNew}
              required
            />
          </Field>
          {isNew && (
            <Field label="Temporary password">
              <input
                className="field"
                type="password"
                value={editor.values.password}
                onChange={(event) => update("password", event.target.value)}
                minLength="8"
                required
              />
            </Field>
          )}
          <label className="flex items-center gap-3 px-3 py-3 text-sm font-bold border rounded-md col-span-full border-slate-200 text-slate-700">
            <input
              className="w-4 h-4 accent-brand-600"
              checked={editor.values.isActive}
              onChange={(event) => update("isActive", event.target.checked)}
              type="checkbox"
            />
            Available for new delivery assignments
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-7">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : isNew ? "Add rider" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children, full = false }) {
  return (
    <label
      className={`grid gap-2 text-sm font-bold text-slate-700 ${full ? "sm:col-span-2" : ""}`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}
