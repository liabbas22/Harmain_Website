import Button from "./Button";

export default function Modal({
  title,
  children,
  onClose,
  size = "max-w-4xl",
}) {
  return (
    <div
      className="fixed inset-0 z-30 grid p-3 place-items-center bg-slate-950/50 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className={`max-h-[calc(100vh-24px)] w-full overflow-y-auto rounded-lg bg-white shadow-2xl ${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 sm:px-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">
              Operations
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              {title}
            </h2>
          </div>
          <Button
            variant="danger"
            className="text-lg leading-none rounded-full"
            onClick={onClose}
            aria-label="Close"
          >
            X
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
