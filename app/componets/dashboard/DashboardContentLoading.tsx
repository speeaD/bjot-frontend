export default function DashboardContentLoading({ label, cards = 3, layout = "grid" }: {
  label: string;
  cards?: number;
  layout?: "grid" | "stack";
}) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className={layout === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm">
            <div className="space-y-4 motion-safe:animate-pulse">
              <div className="h-9 w-9 rounded-lg bg-slate-200" />
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="space-y-2">
                <div className="h-3 rounded bg-slate-100" />
                <div className="h-3 w-4/5 rounded bg-slate-100" />
              </div>
              <div className="h-7 w-24 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
