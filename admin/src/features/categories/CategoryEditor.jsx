import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

export default function CategoryEditor({ editor, onChange, onClose, onSave, busy }) {
  const update = (key, value) => onChange({ ...editor, values: { ...editor.values, [key]: value } });
  return <Modal title={editor.id ? "Edit category" : "Add category"} onClose={onClose} size="max-w-2xl"><form className="p-4 sm:p-6" onSubmit={onSave}><div className="grid gap-4 sm:grid-cols-2"><Field label="Category name"><input className="field" value={editor.values.name} onChange={(event) => update("name", event.target.value)} required /></Field><Field label="Image URL"><input className="field" type="url" value={editor.values.image} onChange={(event) => update("image", event.target.value)} placeholder="https://..." /></Field><Field label="Description" full><textarea className="field" rows="4" value={editor.values.description} onChange={(event) => update("description", event.target.value)} /></Field><label className="col-span-full flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700"><input className="h-4 w-4 accent-brand-600" checked={editor.values.isActive} onChange={(event) => update("isActive", event.target.checked)} type="checkbox" />Keep this category active</label></div><div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save category"}</Button></div></form></Modal>;
}

function Field({ label, children, full = false }) { return <label className={`grid gap-2 text-sm font-bold text-slate-700 ${full ? "sm:col-span-2" : ""}`}><span>{label}</span>{children}</label>; }
