export default function Toast({ toast }) {
  if (!toast) return null;
  const color = toast.type === "error" ? "bg-red-700" : toast.type === "warning" ? "bg-amber-700" : toast.type === "info" ? "bg-slate-800" : "bg-emerald-700";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-[calc(100vw-48px)] rounded-md px-4 py-3 text-sm font-extrabold text-white shadow-xl ${color}`}
      role="status"
    >
      {toast.message}
    </div>
  );
}
