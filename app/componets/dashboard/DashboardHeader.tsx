'use client';

import { Search, Bell, User } from "lucide-react";

interface DashboardHeaderProps {
  adminName?: string;
  adminRole?: string;
  notificationCount?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export default function DashboardHeader({
  adminName = "Blast Jamb Online",
  adminRole = "Administrator",
  notificationCount = 1,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search candidates, exams, logs...",
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-14 z-30 border-b border-gray-200 bg-white px-4 py-3 lg:top-0 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="relative min-w-0 max-w-2xl flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-bg focus:bg-white transition-colors"
          />
        </div>

        <div className="hidden flex-1 sm:block" />

        <button className="relative hidden rounded-lg p-2 transition-colors hover:bg-gray-100 sm:block">
          <Bell className="w-5 h-5 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="hidden items-center gap-3 pl-2 sm:flex">
          <div className="text-right hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-gray-900">{adminName}</p>
            <p className="text-xs text-gray-500">{adminRole}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#0d2818] flex items-center justify-center shrink-0">
            <User className="w-4.5 h-4.5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
