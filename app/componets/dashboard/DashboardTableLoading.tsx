export default function DashboardTableLoading({ label }: { label: string }) {
  return (
    <div role="status" className="p-5">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
        <div className="h-9 rounded-lg bg-slate-100" />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 py-2">
            <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 max-w-48 rounded bg-slate-200" />
              <div className="h-2 w-1/2 max-w-32 rounded bg-slate-100" />
            </div>
            <div className="hidden h-5 w-20 rounded bg-slate-200 sm:block" />
            <div className="h-5 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
