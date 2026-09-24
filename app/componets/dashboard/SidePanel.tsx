import { Trophy, KeyRound, TimerReset, Download, RefreshCw, ChevronRight, Zap } from "lucide-react";

export function HallOfAchievement() {
  return (
    <div className="bg-[#0d2818] text-white rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold tracking-widest text-orange-400">
          HALL OF ACHIEVEMENT
        </p>
        <Trophy className="w-4 h-4 text-orange-400" />
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-bold text-orange-400">368</span>
        <span className="text-sm text-white/70">Highest JAMB Score</span>
      </div>
      <p className="text-sm text-white/60 leading-relaxed">
        Achieved by student <span className="font-semibold text-white">David O. Adekunle</span> in
        Medical Mock Series 8.4. Overall cohort percentile 99.98%.
      </p>
    </div>
  );
}

const OPERATIONS = [
  { label: "Generate Access Keys", icon: KeyRound },
  { label: "Synchronize Question Banks", icon: RefreshCw },
];

export function QuickOperations() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold tracking-widest text-gray-500">
          QUICK CBT OPERATIONS
        </p>
        <Zap className="w-4 h-4 text-orange-500" />
      </div>
      <div className="space-y-1">
        {OPERATIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 text-gray-400" />
              {label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface AuditEntry {
  name: string;
  detail: string;
  meta: string;
  score: string;
  scoreTone?: "orange" | "green";
}

const AUDIT_ENTRIES: AuditEntry[] = [
  {
    name: "Olisa Emeka",
    detail: "Submitted BJOT MOCK 9.0 (MEEB) • Physics 38/40",
    meta: "1 min ago • Lab A Station 14",
    score: "Score 312/400",
    scoreTone: "orange",
  },
  {
    name: "Chiamaka Adeleke",
    detail: "Section 1 Complete: JAMB Biology Use of English",
    meta: "3 mins ago • Biometric Verified",
    score: "Perfect 40/40",
    scoreTone: "green",
  },
  {
    name: "Babatunde Bello",
    detail: "Access Code Key: #BJOT-7781-X",
    meta: "5 mins ago • IP: 197.210.44.12",
    score: "Session Started",
  },
  {
    name: "Zainab Farouk",
    detail: "Submitted Medical & Biological Sciences Exam",
    meta: "",
    score: "Score 294/400",
    scoreTone: "orange",
  },
];

export function ProctorAudit() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          PROCTOR &amp; LIVE AUDIT
        </span>
        <span className="text-[11px] text-gray-400">Real-time</span>
      </div>

      <div className="divide-y divide-gray-100">
        {AUDIT_ENTRIES.map((entry) => (
          <div key={entry.name} className="py-3 first:pt-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
              <span
                className={`text-xs font-semibold ${
                  entry.scoreTone === "green"
                    ? "text-green-600"
                    : entry.scoreTone === "orange"
                    ? "text-orange-500"
                    : "text-gray-400"
                }`}
              >
                {entry.score}
              </span>
            </div>
            <p className="text-xs text-gray-500">{entry.detail}</p>
            {entry.meta && <p className="text-[11px] text-gray-400 mt-0.5">{entry.meta}</p>}
          </div>
        ))}
      </div>

      <button className="w-full text-center text-sm font-semibold text-[#0d2818] mt-2 pt-1 hover:underline">
        View Complete System Audit Log
      </button>
    </div>
  );
}
