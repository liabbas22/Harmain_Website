import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return <Modal title={title} onClose={onCancel} size="max-w-md"><div className="p-6"><span className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-xl font-extrabold text-red-700">!</span><p className="mt-4 text-sm leading-6 text-slate-600">{message}</p><div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant="danger" onClick={onConfirm}>Delete</Button></div></div></Modal>;
}
