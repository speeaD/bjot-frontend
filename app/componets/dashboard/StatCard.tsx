import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  footer: ReactNode;
  rightSlot?: ReactNode;
}

export default function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
  footer,
  rightSlot,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-semibold tracking-wide text-gray-500">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
        {rightSlot}
      </div>

      <div className="mt-2 text-xs text-gray-500">{footer}</div>
    </div>
  );
}
