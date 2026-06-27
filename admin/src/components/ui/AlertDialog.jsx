import Button from "./Button";
import Modal from "./Modal";

export default function AlertDialog({ title, message, onClose }) {
  return (
    <Modal title={title} onClose={onClose} size="max-w-md">
      <div className="p-6">
        <span className="grid w-10 h-10 text-xl font-extrabold text-red-700 rounded-full place-items-center bg-red-50">
          !
        </span>
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
        <div className="flex justify-end mt-7">
          <Button className="h-10 px-5" onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
}
