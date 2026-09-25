'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "../BrandLogo";
import {
  FileText,
  BookOpen,
  ListChecks,
  Users,
  ClipboardCheck,
  BarChart3,
  Trophy,
  KeyRound,
  Settings,
  LogOut,
  PanelsTopLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Exam Feed / Exams", icon: FileText },
  { href: "/question-set", label: "Question Bank & Subjects", icon: BookOpen },
  { href: "/question-organizer", label: "Question Organizer", icon: ListChecks },
  { href: "/cms", label: "Landing Page & CMS", icon: PanelsTopLeft },
  { href: "/quiz-takers", label: "Students & Candidates", icon: Users },
  { href: "/attendance", label: "Attendance & Logs", icon: ClipboardCheck },
  { href: "/analytics", label: "Analytics & Reports", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard & Rankings", icon: Trophy },
  { href: "/access-codes", label: "Access Codes & Keys", icon: KeyRound },
  { href: "/settings", label: "Settings & Portal Control", icon: Settings },
];

export default function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[272px] max-w-full shrink-0 flex-col overflow-y-auto bg-[#0d2818] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <BrandLogo variant="dark" />
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-wide">BJOT</p>
          <p className="mt-0.5 text-[9px] font-semibold tracking-[.11em] text-white/60">ADMIN PORTAL</p>
        </div>
      </div>

      <div className="h-px bg-white/10 mx-5" />

      {/* Nav */}
      <div className="px-4 pt-5">
        <p className="px-2 text-[10px] font-semibold tracking-widest text-white/40 mb-2">
          DASHBOARD
        </p>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/"
              ? pathname === "/" || pathname.startsWith("/exams/") || pathname === "/create-quiz" || pathname === "/explore"
              : href === "/attendance"
                ? pathname.startsWith("/attendance") || pathname.startsWith("/schedules")
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#ff9423] text-[#15271f]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1" />

      {/* JAMB Sync status */}
      {/* <div className="mx-4 mb-4 mt-6 rounded-xl bg-white/5 border border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold tracking-wide text-white/70">
            SESSION CYCLE
          </p>
          <span className="flex items-center gap-1 text-[11px] font-medium text-orange-400">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Active
          </span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/50">2025/2026</span>
          <span className="font-semibold">Active</span>
        </div>
      </div> */}

      <button className="flex items-center gap-2 px-6 pb-6 text-sm text-white/70 hover:text-white transition-colors">
        <LogOut className="w-4 h-4" />
        Log Out
      </button>
    </aside>
  );
}
