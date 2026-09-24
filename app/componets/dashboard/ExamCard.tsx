import Link from "next/link";
import { Clock, LucideIcon } from "lucide-react";

interface InfoRow {
  left: string;
  right: string;
  rightBold?: boolean;
}

interface ExamCardProps {
  topBar?: "orange" | "green";
  kicker: string;
  badge: { text: string; tone: "completed" | "scheduled" | "draft" };
  title: string;
  subtitle: string;
  progress?: {
    label: string;
    value: string;
    percent: number;
    barColor?: string;
  };
  infoRows: InfoRow[];
  duration: string;
  action: { label: string; href: string; icon?: LucideIcon; variant?: "outline" | "orange" };
}

const badgeStyles: Record<ExamCardProps["badge"]["tone"], string> = {
  completed: "bg-gray-100 text-gray-700",
  scheduled: "bg-orange-100 text-orange-700",
  draft: "bg-gray-100 text-gray-500",
};

const topBarStyles = {
  orange: "bg-orange-500",
  green: "bg-[#0d2818]",
};

export default function ExamCard({
  topBar = "orange",
  kicker,
  badge,
  title,
  subtitle,
  progress,
  infoRows,
  duration,
  action,
}: ExamCardProps) {
  const ActionIcon = action.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className={`h-1 ${topBarStyles[topBar]}`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold tracking-widest text-gray-400">
            {kicker}
          </p>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeStyles[badge.tone]}`}>
            {badge.tone !== "draft" && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  badge.tone === "completed" ? "bg-gray-400" : "bg-orange-500"
                }`}
              />
            )}
            {badge.text}
          </span>
        </div>

        <h3 className="text-sm font-bold text-gray-900 leading-snug">{title}</h3>
        <p className="text-xs text-gray-500 mb-4">{subtitle}</p>

        {progress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-500">{progress.label}</span>
              <span className="font-bold text-gray-900">{progress.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${progress.barColor ?? "bg-[#0d2818]"}`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5 mb-4">
          {infoRows.map((row, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{row.left}</span>
              <span className={row.rightBold ? "font-semibold text-gray-900" : "text-gray-600"}>
                {row.right}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {duration}
          </span>
          <Link
            href={action.href}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              action.variant === "orange"
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {action.label}
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
          </Link>
        </div>
      </div>
    </div>
  );
}
