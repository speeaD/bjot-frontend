/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardContentLoading from "./dashboard/DashboardContentLoading";
import {
  Activity,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Fingerprint,
  GraduationCap,
  ListChecks,
  Plus,
  RefreshCw,
} from "lucide-react";
import { adminApi } from "../lib/api/attendance-client";
import { AttendanceSession, Department } from "../types/global";
import { formatDate, formatTime } from "../lib/utils/attendance-utils";

interface Props {
  initialSessions: Record<Department, AttendanceSession[]> | null;
  initialDate: string;
  initialError: string | null;
}
const departments: Department[] = ["Sciences", "Arts", "Commercial"];
const labels: Record<
  Department,
  { title: string; number: string; icon: React.ReactNode }
> = {
  Sciences: {
    title: "Sciences & Medicine",
    number: "01",
    icon: <Fingerprint className="h-4 w-4" />,
  },
  Arts: {
    title: "Arts & Humanities",
    number: "02",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  Commercial: {
    title: "Commercial & Management",
    number: "03",
    icon: <Activity className="h-4 w-4" />,
  },
};

export default function DailyDashboardClient({
  initialSessions,
  initialDate,
  initialError,
}: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [sessions, setSessions] = useState<
    Record<Department, AttendanceSession[]>
  >(initialSessions || { Sciences: [], Arts: [], Commercial: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState<Record<Department, boolean>>({
    Sciences: true,
    Arts: true,
    Commercial: true,
  });

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.getSessionsForDate(selectedDate);
      setSessions(response.data);
    } catch (reason: any) {
      setError(reason.message || "Unable to load attendance sessions");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);
  useEffect(() => {
    if (selectedDate !== initialDate) {
      loadSessions();
      router.push("/attendance?date=" + selectedDate);
    }
  }, [selectedDate, initialDate, loadSessions, router]);
  useEffect(() => {
    const timer = setInterval(loadSessions, 300000);
    return () => clearInterval(timer);
  }, [loadSessions]);

  const allSessions = useMemo(
    () => departments.flatMap((department) => sessions[department] || []),
    [sessions],
  );
  const totalStudents = allSessions.reduce(
    (sum, session) => sum + session.totalStudents,
    0,
  );
  const totalPresent = allSessions.reduce(
    (sum, session) => sum + session.presentCount,
    0,
  );
  const attendance = totalStudents ? (totalPresent / totalStudents) * 100 : 0;
  const live = allSessions.filter(
    (session) =>
      session.attendanceWindow?.isOpen || session.status === "ongoing",
  );

  const createSessions = async (department: Department) => {
    try {
      await adminApi.createSessionsFromSchedule(department, selectedDate);
      setNotice("Sessions created for " + department);
      loadSessions();
    } catch (reason: any) {
      setError(reason.message || "Could not create sessions");
    }
  };
  const toggleWindow = async (session: AttendanceSession) => {
    try {
      if (session.attendanceWindow?.isOpen) {
        await adminApi.closeAttendanceWindow(session._id);
        setNotice("Roll call closed");
      } else {
        await adminApi.openAttendanceWindow(session._id, {
          durationMinutes: 30,
          bufferMinutes: 15,
        });
        setNotice("Attendance window opened");
      }
      loadSessions();
    } catch (reason: any) {
      setError(reason.message || "Could not update roll call");
    }
  };
  const shiftDay = (delta: number) => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() + delta);
    setSelectedDate(date.toISOString().slice(0, 10));
  };

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#091d15] sm:text-3xl">
              Attendance &amp; Check-ins
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage BJOT class schedules, live biometric roll calls,
              and student session tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/attendance/analytics")}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#193026] shadow-sm ring-1 ring-[#e5ebe8]"
            >
              <Activity className="h-4 w-4" /> View analytics
            </button>
            <button
              onClick={() => router.push("/schedules")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#004b37] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003b2c]"
            >
              <Plus className="h-4 w-4" /> Create schedule
            </button>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Summary
            icon={<CalendarDays />}
            label="Today's class volume"
            value={allSessions.length.toString()}
            detail="Sessions scheduled"
            tone="mint"
          />
          <Summary
            icon={<Check />}
            label="Candidate attendance rate"
            value={attendance.toFixed(1) + "%"}
            detail={
              totalPresent.toLocaleString() +
              " present / " +
              totalStudents.toLocaleString()
            }
            tone="orange"
          />
          <Summary
            icon={<Fingerprint />}
            label="Real-time biometrics"
            value={live.length.toString() + " sessions"}
            detail={live.length ? "Actively live" : "No current live window"}
            tone="peach"
          />
        </section>

        <section className="mb-4 flex flex-col gap-3 rounded-xl border border-[#e5ebe8] bg-white p-3 shadow-sm lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-2 rounded-lg bg-[#f2f5f3] p-1">
            <button
              onClick={() => shiftDay(-1)}
              className="rounded p-2 text-slate-600 hover:bg-white"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <CalendarDays className="h-4 w-4 text-[#a74408]" />
            <label className="min-w-0">
              <span className="sr-only">Selected date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-[150px] bg-transparent text-xs font-semibold text-[#15271f] outline-none"
              />
            </label>
            <button
              onClick={() => shiftDay(1)}
              className="rounded p-2 text-slate-600 hover:bg-white"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">{formatDate(selectedDate)}</p>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={loadSessions}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#004b37] hover:bg-[#edf4ef] disabled:opacity-50"
            >
              <RefreshCw
                className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")}
              />{" "}
              Refresh
            </button>
            {departments.map((department) => (
              <span
                key={department}
                className="hidden rounded-lg bg-[#f3f5f4] px-2.5 py-1.5 text-[10px] font-medium text-slate-600 xl:inline"
              >
                {department} ({(sessions[department] || []).length})
              </span>
            ))}
          </div>
        </section>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="space-y-4">
            {loading ? (
              <DashboardContentLoading label="Loading attendance sessions" layout="stack" />
            ) : (
              departments.map((department) => (
                <DepartmentPanel
                  key={department}
                  department={department}
                  list={sessions[department] || []}
                  open={expanded[department]}
                  onToggle={() =>
                    setExpanded((value) => ({
                      ...value,
                      [department]: !value[department],
                    }))
                  }
                  onCreate={() => createSessions(department)}
                  onWindow={toggleWindow}
                  onDetails={(id) => router.push("/attendance/sessions/" + id)}
                />
              ))
            )}
          </div>
          <aside className="space-y-4">
            <section className="rounded-xl border border-[#e5ebe8] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#17281f]">
                    Fast check-in
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manual candidate roll call
                  </p>
                </div>
                <Fingerprint className="h-5 w-5 text-[#a74408]" />
              </div>
              <p className="mb-4 text-xs leading-5 text-slate-500">
                Rapid student verification using BJOT registration code.
              </p>
              <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">
                Student registration code
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  placeholder="e.g. BJOT-2026-…"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#004b37]"
                />
                <button className="rounded-lg bg-[#004b37] px-3 text-xs font-semibold text-white">
                  Mark
                </button>
              </div>
              
            </section>
            
            <section className="rounded-xl bg-[#003d2e] p-4 text-white shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#ffad4c]">
                Notice for examiners
              </p>
              <h2 className="mt-2 text-lg font-bold">
                Roll call locking policy
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/70">
                Attendance sessions lock automatically after the lecture window.
                Late records require proctor authorization.
              </p>
              <div className="mt-4 border-t border-white/10 pt-3 text-[10px] text-white/60">
                Sync status: <b className="text-white">Healthy</b>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Summary({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "mint" | "orange" | "peach";
}) {
  const colors = {
    mint: "bg-[#e7f5ed] text-[#004b37]",
    orange: "bg-[#fff0e3] text-[#a74408]",
    peach: "bg-[#ffe5d4] text-[#a74408]",
  };
  return (
    <article className="rounded-xl border border-[#e5ebe8] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-600">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#0c1e16]">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span
          className={
            "grid h-9 w-9 place-items-center rounded-lg " + colors[tone]
          }
        >
          {icon}
        </span>
      </div>
    </article>
  );
}
function DepartmentPanel({
  department,
  list,
  open,
  onToggle,
  onCreate,
  onWindow,
  onDetails,
}: {
  department: Department;
  list: AttendanceSession[];
  open: boolean;
  onToggle: () => void;
  onCreate: () => void;
  onWindow: (session: AttendanceSession) => void;
  onDetails: (id: string) => void;
}) {
  const heading = labels[department];
  const live = list.filter(
    (item) => item.attendanceWindow?.isOpen || item.status === "ongoing",
  ).length;
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5ebe8] bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-[#f7f8f7] p-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#004b37] text-white">
          {heading.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-[#12231b]">
            {heading.title}{" "}
            <span className="ml-1 rounded bg-[#e5e9e7] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-slate-500">
              FACULTY {heading.number}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            {list.length} classes scheduled today ·{" "}
            <b className={live ? "text-[#b24510]" : "text-slate-500"}>
              {live} live now
            </b>
          </p>
        </div>
        {!list.length && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-1 rounded-lg bg-[#004b37] px-3 py-2 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> New session
          </button>
        )}
        <button onClick={onToggle} className="rounded-lg p-2 text-slate-500">
          <ChevronDown
            className={"h-4 w-4 transition " + (open ? "" : "-rotate-90")}
          />
        </button>
      </div>
      {open && (
        <div className="divide-y divide-slate-100">
          {list.length ? (
            list.map((session) => (
              <SessionRow
                key={session._id}
                session={session}
                onWindow={onWindow}
                onDetails={onDetails}
              />
            ))
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              No sessions were created for this faculty on the selected day.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
function SessionRow({
  session,
  onWindow,
  onDetails,
}: {
  session: AttendanceSession;
  onWindow: (session: AttendanceSession) => void;
  onDetails: (id: string) => void;
}) {
  const rate = session.totalStudents
    ? (session.presentCount / session.totalStudents) * 100
    : 0;
  const active =
    session.attendanceWindow?.isOpen || session.status === "ongoing";
  return (
    <article className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-center">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={
              "h-2 w-2 rounded-full " +
              (active
                ? "bg-[#ff9423]"
                : session.status === "completed"
                  ? "bg-[#004b37]"
                  : "bg-slate-300")
            }
          />
          <h3 className="font-semibold text-[#16271f]">
            {session.questionSetTitle}
          </h3>
          <span
            className={
              "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] " +
              (active
                ? "bg-[#fff0e3] text-[#a74408]"
                : session.status === "completed"
                  ? "bg-[#dff4e8] text-[#176148]"
                  : "bg-slate-100 text-slate-500")
            }
          >
            {active ? "In progress" : session.status}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock3 className="h-3.5 w-3.5 text-[#a74408]" />{" "}
          {formatTime(session.scheduledStartTime)} –{" "}
          {formatTime(session.scheduledEndTime)}
        </p>
      </div>
      <div className="text-left md:text-right">
        <p className="text-lg font-bold text-[#15271f]">
          {session.presentCount}
          <span className="text-slate-400"> / {session.totalStudents}</span>
        </p>
        <p className="text-[10px] text-slate-500">
          {rate.toFixed(1)}% attendance
        </p>
      </div>
      <div className="flex justify-start gap-2 md:justify-end">
        {session.status === "completed" ? (
          <button
            onClick={() => onDetails(session._id)}
            className="rounded-lg bg-[#eff2f1] px-3 py-2 text-xs font-semibold text-[#30453a]"
          >
            View roster
          </button>
        ) : (
          <button
            onClick={() => onWindow(session)}
            className="rounded-lg bg-[#004b37] px-3 py-2 text-xs font-semibold text-white"
          >
            {active ? "Close roll call" : "Open session"}
          </button>
        )}
      </div>
    </article>
  );
}
