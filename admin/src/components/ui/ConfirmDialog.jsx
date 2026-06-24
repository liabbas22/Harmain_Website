import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return (
    <Modal title={title} onClose={onCancel} size="max-w-md">
      <div className="p-6">
        <span className="grid w-10 h-10 text-xl font-extrabold text-red-700 rounded-full place-items-center bg-red-50">
          !
        </span>
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
        <div className="flex justify-end gap-3 mt-7">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
