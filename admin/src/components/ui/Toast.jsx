import { useCallback, useEffect, useRef, useState } from "react";

const colors = {
  error: "bg-red-700",
  warning: "bg-amber-700",
  info: "bg-slate-800",
  success: "bg-emerald-700",
};

function ToastItem({ toast, total, index, onDismiss }) {
  const color = colors[toast.type] || colors.success;
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(0);
  const entryDelay = Number(toast.entryDelay || 0);
  const dismissAfter = Number(
    toast.dismissAfter ||
      (["info", "warning", "error"].includes(toast.type) ? 10500 : 5200),
  );

  const clearDismissTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startDismissTimer = useCallback(
    (duration) => {
      if (!onDismiss) return;
      clearDismissTimer();
      remainingRef.current = duration;
      startedAtRef.current = Date.now();
      timerRef.current = window.setTimeout(
        () => onDismiss(toast.id),
        duration,
      );
    },
    [clearDismissTimer, onDismiss, toast.id],
  );

  useEffect(() => {
    setIsVisible(false);
    const showTimer = window.setTimeout(() => setIsVisible(true), entryDelay);
    return () => window.clearTimeout(showTimer);
  }, [entryDelay, toast.id]);

  useEffect(() => {
    startDismissTimer(entryDelay + dismissAfter);
    return clearDismissTimer;
  }, [clearDismissTimer, dismissAfter, entryDelay, startDismissTimer]);

  const pauseDismiss = () => {
    if (!onDismiss || isPaused) return;
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(1500, remainingRef.current - elapsed);
    clearDismissTimer();
    setIsPaused(true);
  };

  const resumeDismiss = () => {
    if (!onDismiss || !isPaused) return;
    setIsPaused(false);
    startDismissTimer(remainingRef.current);
  };

  return (
    <div
      className={`w-full rounded-md px-4 py-3 text-sm font-extrabold text-white shadow-xl ring-1 ring-white/10 transition-all duration-300 ease-out ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"} ${color}`}
      role="status"
      onMouseEnter={pauseDismiss}
      onMouseLeave={resumeDismiss}
      onFocus={pauseDismiss}
      onBlur={resumeDismiss}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 leading-5">{toast.message}</span>
        <div className="flex shrink-0 items-center gap-2">
          {index === 0 && total > 1 && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black">
              {total}
            </span>
          )}
          {isPaused && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black">
              paused
            </span>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-xs hover:bg-white/20"
              aria-label="Dismiss notification"
            >
              x
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Toast({ toast, toasts, onDismiss }) {
  const visibleToasts = Array.isArray(toasts)
    ? toasts
    : toast
      ? [toast]
      : [];

  if (!visibleToasts.length) return null;

  return (
    <div className="fixed right-4 top-5 z-50 grid w-[min(380px,calc(100vw-32px))] gap-3 sm:right-6">
      {visibleToasts.map((item, index) => (
        <ToastItem
          key={item.id}
          toast={item}
          total={visibleToasts.length}
          index={index}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
