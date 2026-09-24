import Link from "next/link";
import { BarChart3, ShieldCheck } from "lucide-react";

interface FeaturedExamCardProps {
  kicker: string;
  title: string;
  subtitle: string;
  candidateCount: string;
  elapsed: string;
  percent: number;
  href: string;
}

export default function FeaturedExamCard({
  kicker,
  title,
  subtitle,
  candidateCount,
  elapsed,
  percent,
  href,
}: FeaturedExamCardProps) {
  return (
    <div className="bg-white rounded-xl border border-orange-200 overflow-hidden flex flex-col">
      <div className="h-1 bg-orange-500" />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold tracking-widest text-gray-400">{kicker}</p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-600">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Live Now
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 leading-snug">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{subtitle}</p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-500">Simultaneous Active</span>
            <span className="font-bold text-gray-900">{candidateCount} Candidates</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden mb-2">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-orange-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              Synchronized
            </span>
            <span className="text-gray-400">{elapsed}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
            <ShieldCheck className="w-4 h-4" />
            Proctor Active
          </span>
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            Analyse exam
            <BarChart3 className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
