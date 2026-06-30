const shimmer = "animate-pulse rounded-md bg-slate-200";

export function SkeletonLine({ className = "h-4 w-full" }) {
  return <span className={`block ${shimmer} ${className}`} />;
}

export function CardSkeleton({ lines = 3, className = "" }) {
  return (
    <article className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}>
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="mt-5 h-8 w-28" />
      <div className="mt-5 grid gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLine
            key={index}
            className={index === lines - 1 ? "h-3 w-2/3" : "h-3 w-full"}
          />
        ))}
      </div>
    </article>
  );
}

export function CardGridSkeleton({ count = 4, className = "sm:grid-cols-2 xl:grid-cols-4" }) {
  return (
    <section className={`grid gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </section>
  );
}

export function TableSkeleton({ rows = 6, columns = 5, minWidth = "760px" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr className="h-11 border-b border-slate-200 bg-slate-50">
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4">
                <SkeletonLine className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <td key={columnIndex} className="px-4 py-4">
                  <SkeletonLine
                    className={
                      columnIndex === 0
                        ? "h-4 w-40"
                        : columnIndex === columns - 1
                          ? "ml-auto h-4 w-16"
                          : "h-4 w-24"
                    }
                  />
                  {columnIndex === 0 && <SkeletonLine className="mt-2 h-3 w-28" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InlineLoadingBar() {
  return (
    <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-red-100">
      <span className="block h-full w-1/3 animate-pulse bg-brand-700" />
    </div>
  );
}

export function PanelSkeleton({ rows = 4, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}>
      <SkeletonLine className="h-4 w-40" />
      <div className="mt-5 grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-[44px_minmax(0,1fr)_70px] items-center gap-3">
            <SkeletonLine className="h-10 w-10 rounded-full" />
            <div className="grid gap-2">
              <SkeletonLine className="h-4 w-3/4" />
              <SkeletonLine className="h-3 w-1/2" />
            </div>
            <SkeletonLine className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
