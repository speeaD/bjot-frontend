'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import DashboardPageHero, { getDashboardPageDetails } from './DashboardPageHero';
import ConditionalNavbar from '../ConditionalNavbar';

export default function DashboardShell({ children, showHeader = false }: { children: React.ReactNode; showHeader?: boolean }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDashboard = !['/login', '/take-quiz'].some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
  const pageDetails = getDashboardPageDetails(pathname);
  // These operational dashboards supply their own compact, task-specific
  // headings and controls, so the generic hero would repeat the page title.
  const usesInlineDashboardHeader = ["/attendance", "/analytics", "/leaderboard", "/question-set", "/cms"].includes(pathname) || pathname.startsWith("/question-set/");

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  if (!isDashboard) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">
        <DashboardSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
          <div role="dialog" aria-modal="true" aria-label="Dashboard navigation" className="relative h-full w-[min(272px,85vw)] shadow-2xl">
            <DashboardSidebar onNavigate={() => setSidebarOpen(false)} />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="absolute right-3 top-4 rounded-lg p-2 text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className={`min-w-0 flex-1 ${pageDetails ? 'dashboard-page' : ''}`}>
        <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
            className="rounded-lg p-2 text-[#0d2818] hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-[#0d2818]">BJOT ADMIN</span>
        </div>
        {showHeader && <ConditionalNavbar />}
        {pageDetails && !usesInlineDashboardHeader && <DashboardPageHero {...pageDetails} />}
        {children}
      </div>
    </div>
  );
}
