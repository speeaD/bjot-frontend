'use client';

import { usePathname } from "next/navigation";
import DashboardHeader from "./dashboard/DashboardHeader";

// The Exam Feed dashboard ("/") ships its own header inside DashboardHeader,
// so we hide the generic top Navbar there to avoid a duplicate bar.
export default function ConditionalNavbar() {
  const pathname = usePathname();
  // The directory page supplies its own portal-style header.
  if (pathname === "/" || pathname === "/quiz-takers") return null;
  return <DashboardHeader />;
}
