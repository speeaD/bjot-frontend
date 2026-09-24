import { ChevronRight } from "lucide-react";

type PageDetails = {
  title: string;
  description: string;
  section: string;
};

const PAGES: Array<{
  matches: (pathname: string) => boolean;
  details: PageDetails;
}> = [
  {
    matches: (path) => path === "/explore",
    details: {
      title: "Explore Exams",
      description:
        "Discover available quizzes and create new examinations for your candidates.",
      section: "EXAM MANAGEMENT",
    },
  },
  {
    matches: (path) => path === "/question-set",
    details: {
      title: "Question Bank & Subjects",
      description:
        "Organise reusable subjects, question sets, and batches for your examinations.",
      section: "QUESTION BANK",
    },
  },
  {
    matches: (path) => path === "/cms",
    details: {
      title: "Landing Page & CMS",
      description:
        "Manage the public landing experience, announcements, and proof statistics.",
      section: "PORTAL ADMINISTRATION",
    },
  },
  {
    matches: (path) => path.startsWith("/question-set/"),
    details: {
      title: "Subject Details",
      description:
        "Review questions, manage batches, and keep this subject ready for exams.",
      section: "QUESTION BANK",
    },
  },
  {
    matches: (path) => path === "/analytics",
    details: {
      title: "Analytics & Reports",
      description:
        "Track submissions, candidate performance, completion rates, and exam trends.",
      section: "REPORTING",
    },
  },
  {
    matches: (path) => path === "/leaderboard",
    details: {
      title: "Leaderboard & Rankings",
      description:
        "Explore candidate standings and performance across mock examinations.",
      section: "PERFORMANCE",
    },
  },
  {
    matches: (path) => path === "/attendance",
    details: {
      title: "Attendance & Logs",
      description:
        "Manage daily attendance and review participation across departments.",
      section: "ATTENDANCE",
    },
  },
  {
    matches: (path) => path === "/attendance/analytics",
    details: {
      title: "Attendance Analytics",
      description:
        "Understand attendance patterns by department and date range.",
      section: "ATTENDANCE",
    },
  },
  {
    matches: (path) => path.startsWith("/attendance/sessions/"),
    details: {
      title: "Session Attendance",
      description:
        "Review a session, its attendance records, and candidate status.",
      section: "ATTENDANCE",
    },
  },
  {
    matches: (path) => path === "/schedules",
    details: {
      title: "Schedule Manager",
      description:
        "Plan weekly classes and keep department schedules up to date.",
      section: "ATTENDANCE",
    },
  },
  {
    matches: (path) => path === "/create-quiz",
    details: {
      title: "Create New Exam",
      description:
        "Set up an exam, select its subjects, and review the configuration.",
      section: "EXAM MANAGEMENT",
    },
  },
  {
    matches: (path) => path.startsWith("/exams/") && path.endsWith("/edit"),
    details: {
      title: "Edit Exam",
      description: "Update exam details, options, and assigned question sets.",
      section: "EXAM MANAGEMENT",
    },
  },
  {
    matches: (path) => path.startsWith("/exams/"),
    details: {
      title: "Exam Overview",
      description:
        "Review exam settings, assigned subjects, and candidate activity.",
      section: "EXAM MANAGEMENT",
    },
  },
  {
    matches: (path) => path === "/account",
    details: {
      title: "My Account",
      description: "Review your administrator account and portal access.",
      section: "PORTAL SETTINGS",
    },
  },
];

export function getDashboardPageDetails(
  pathname: string,
): PageDetails | undefined {
  return PAGES.find((page) => page.matches(pathname))?.details;
}

export default function DashboardPageHero({
  title,
  description,
  section,
}: PageDetails) {
  return (
    <section className="dashboard-page-hero relative mx-4 mt-5 overflow-hidden rounded-2xl bg-[#0d2818] px-5 py-6 text-white shadow-sm sm:mx-6 sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-size:13px_13px]" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#f5aa43]">
          <span className="rounded-full bg-orange-500/15 px-3 py-1">
            BJOT ADMIN
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-white/45" />
          <span>{section}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
          {description}
        </p>
      </div>
    </section>
  );
}
