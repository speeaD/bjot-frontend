/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardTableLoading from "../componets/dashboard/DashboardTableLoading";
import DashboardContentLoading from "../componets/dashboard/DashboardContentLoading";
import {
  Award,
  ChevronUp,
  Download,
  Filter,
  Search,
  Target,
  Trophy,
} from "lucide-react";

interface Submission {
  _id: string;
  quizId: { _id: string; settings: { title: string } };
  quizTakerId: {
    _id: string;
    name?: string;
    email?: string;
    accessCode: string;
  };
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  questionSetSubmissions?: {
    questionSetOrder: number;
    submittedAt: string;
    score: number;
    percentage: number;
  }[];
}
interface Quiz {
  _id: string;
  settings: { title: string };
}
type Entry = {
  rank: number;
  name: string;
  accessCode: string;
  averageScore: number;
  totalQuizzes: number;
  totalPoints: number;
  subject?: { best: number; average: number; attempts: number };
};

const nameOf = (value: string) =>
  value
    .replace(/@.*$/, "")
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const initials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ST";
const scoreStyle = (score: number) =>
  score >= 85
    ? "bg-[#004b37] text-white"
    : score >= 70
      ? "bg-[#edf4ef] text-[#0d2818]"
      : "bg-[#fff0e3] text-[#a4440a]";

export default function LeaderboardClient() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [view, setView] = useState<"global" | "exam">("global");
  const [exam, setExam] = useState("");
  const [subject, setSubject] = useState<number | null>(null);
  const [range, setRange] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/submissions"), fetch("/api/quiz")])
      .then(async ([submissionResponse, quizResponse]) => {
        const [submissionData, quizData] = await Promise.all([
          submissionResponse.json(),
          quizResponse.json(),
        ]);
        setSubmissions(submissionData.submissions || []);
        setQuizzes(quizData.quizzes || []);
      })
      .catch((error) => console.error("Could not load standings", error))
      .finally(() => setLoading(false));
  }, []);

  const entries = useMemo<Entry[]>(() => {
    let list =
      view === "exam" && exam
        ? submissions.filter((item) => item.quizId?._id === exam)
        : submissions;
    if (range !== "all") {
      const since = new Date();
      since.setDate(
        since.getDate() - ({ day: 1, week: 7, month: 30 }[range] || 0),
      );
      list = list.filter((item) => new Date(item.submittedAt) >= since);
    }
    const people = new Map<string, any>();
    list.forEach((item) => {
      if (!item.quizTakerId?._id || !item.totalPoints) return;
      const taker = item.quizTakerId;
      if (!people.has(taker._id))
        people.set(taker._id, {
          name: taker.name || taker.email || "Candidate",
          accessCode: taker.accessCode,
          total: 0,
          count: 0,
          points: 0,
          subjects: [],
        });
      const candidate = people.get(taker._id);
      candidate.total += item.percentage || 0;
      candidate.count += 1;
      candidate.points += Math.round((item.score / item.totalPoints) * 400);
      const data =
        subject === null
          ? undefined
          : item.questionSetSubmissions?.find(
              (set) => set.questionSetOrder === subject,
            );
      if (data) candidate.subjects.push(data);
    });
    return Array.from(people.values())
      .map((candidate): Omit<Entry, "rank"> => {
        const item: Omit<Entry, "rank"> = {
          name: candidate.name,
          accessCode: candidate.accessCode,
          averageScore: candidate.total / candidate.count,
          totalQuizzes: candidate.count,
          totalPoints: candidate.points,
        };
        if (subject !== null && candidate.subjects.length)
          item.subject = {
            best: Math.max(...candidate.subjects.map((set: any) => set.score)),
            average:
              candidate.subjects.reduce(
                (total: number, set: any) => total + set.percentage,
                0,
              ) / candidate.subjects.length,
            attempts: candidate.subjects.length,
          };
        return item;
      })
      .filter((item) => subject === null || item.subject)
      .sort((a, b) =>
        subject === null
          ? b.averageScore - a.averageScore
          : (b.subject?.best || 0) - (a.subject?.best || 0),
      )
      .slice(0, 50)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [submissions, view, exam, subject, range]);

  const visible = entries.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.accessCode?.toLowerCase().includes(search.toLowerCase()),
  );
  const average = entries.length
    ? entries.reduce((sum, item) => sum + item.averageScore, 0) / entries.length
    : 0;
  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            
            <h1 className="text-2xl font-bold tracking-tight text-[#091d15] sm:text-3xl">
              Leaderboard &amp; Standings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor premium students performance across mock examinations
              and subject clusters.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004b37] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#003b2c] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export standings
          </button>
        </header>

        <section className="mb-4 rounded-xl border border-[#e5ebe8] bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => {
                  setView("global");
                  setExam("");
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold ${view === "global" ? "bg-[#ecf2ef] text-[#004b37]" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Trophy className="h-3.5 w-3.5" /> Global leaderboard
              </button>
              <button
                onClick={() => setView("exam")}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${view === "exam" ? "bg-[#ecf2ef] text-[#004b37]" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Per exam mock
              </button>
              <button
                onClick={() => setSubject(subject === null ? 1 : null)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${subject !== null ? "bg-[#ecf2ef] text-[#004b37]" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Subject mastery
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {view === "exam" && (
                <select
                  value={exam}
                  onChange={(event) => setExam(event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
                >
                  <option value="">Select exam</option>
                  {quizzes.map((quiz) => (
                    <option key={quiz._id} value={quiz._id}>
                      {quiz.settings.title}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
              >
                <option value="all">All time</option>
                <option value="month">This month</option>
                <option value="week">This week</option>
                <option value="day">Today</option>
              </select>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 px-1 pt-3">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
              <Target className="mr-1 inline h-3 w-3 text-[#ea8b20]" /> Sets
            </span>
            {[null, 1, 2, 3, 4].map((value) => (
              <button
                key={value ?? "all"}
                onClick={() => setSubject(value)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${subject === value ? "bg-[#004b37] text-white" : "bg-[#f5f7f6] text-slate-600 hover:bg-[#eef4ef]"}`}
              >
                {value === null ? "All subjects" : `Set ${value}`}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric
            label="Tracked candidates"
            value={loading ? "—" : entries.length.toLocaleString()}
            detail="Eligible for current view"
            icon={<Trophy className="h-4 w-4" />}
          />
          <Metric
            label="Benchmark average"
            value={loading ? "—" : `${average.toFixed(1)}%`}
            detail="Across completed attempts"
            icon={<Target className="h-4 w-4" />}
          />
          <Metric
            label="Honour roll"
            value={loading ? "—" : entries
              .filter((item) => item.averageScore >= 90)
              .length.toString()}
            detail="Candidates above 90%"
            icon={<Award className="h-4 w-4" />}
          />
        </section>

        {loading ? (
          <DashboardContentLoading label="Loading top candidates" />
        ) : entries.length >= 3 ? (
          <Podium entries={entries.slice(0, 3)} subject={subject} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Complete submissions will appear here as candidates take their
            exams.
          </div>
        )}

        <section aria-busy={loading} className="mt-5 overflow-hidden rounded-xl border border-[#e5ebe8] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#091d15]">
                Comprehensive standings
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Ranked by{" "}
                {subject !== null
                  ? "best subject-set score"
                  : "average score across submitted exams"}
                .
              </p>
            </div>
            <div className="flex gap-2">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search candidate or code…"
                  className="w-56 rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-[#004b37]"
                />
              </label>
              <button
                className="rounded-lg bg-[#f2f5f3] px-3 text-slate-600"
                aria-label="Filter standings"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          {loading ? <DashboardTableLoading label="Loading leaderboard standings" /> : <>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left">
              <thead className="bg-[#f4f6f5] text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-4 py-3">Candidate / student</th>
                  <th className="px-4 py-3">Average score</th>
                  <th className="px-4 py-3">Exams taken</th>
                  <th className="px-4 py-3">Total points</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((item) => {
                  const score =
                    subject !== null
                      ? item.subject?.average || 0
                      : item.averageScore;
                  return (
                    <tr
                      key={item.accessCode || item.rank}
                      className="transition hover:bg-[#fbfcfb]"
                    >
                      <td className="px-5 py-3.5">
                        <Rank rank={item.rank} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#edf1ef] text-[10px] font-bold text-[#254038]">
                            {initials(item.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#14251e]">
                              {nameOf(item.name)}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.accessCode || "No access code"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold ${scoreStyle(score)}`}
                        >
                          {score.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {subject !== null
                          ? item.subject?.attempts || 0
                          : item.totalQuizzes}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-[#a23d00]">
                        {subject !== null
                          ? item.subject?.best || 0
                          : item.totalPoints.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#176148]">
                          <ChevronUp className="h-3.5 w-3.5" /> Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!visible.length && (
            <p className="p-10 text-center text-sm text-slate-500">
              No standings match this view.
            </p>
          )}
          </>}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e5ebe8] bg-white p-4 shadow-sm">
      <div className="mb-3 grid h-8 w-8 place-items-center rounded-lg bg-[#eff7f3] text-[#004b37]">
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-[#091d15]">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}
function Rank({ rank }: { rank: number }) {
  const color =
    rank === 1
      ? "bg-[#ff9423] text-white"
      : rank === 2
        ? "bg-slate-200 text-slate-700"
        : rank === 3
          ? "bg-[#ffe1ca] text-[#a23d00]"
          : "text-slate-700";
  return (
    <span
      className={`inline-grid h-6 min-w-6 place-items-center rounded-lg px-1 text-xs font-bold ${color}`}
    >
      {rank}
    </span>
  );
}
function Podium({
  entries,
  subject,
}: {
  entries: Entry[];
  subject: number | null;
}) {
  const order = [entries[1], entries[0], entries[2]];
  const heights = ["h-16", "h-24", "h-12"];
  return (
    <section className="overflow-hidden rounded-xl bg-[#003d2e] p-4 sm:p-6 shadow-lg">
      <div className="mb-5 flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#f5aa43]">
            Honour roll
          </p>
          <h2 className="text-sm font-semibold text-white">
            Current distinguished fellows
          </h2>
        </div>
        <span className="rounded bg-[#ddf3e7]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#b9e8d3]">
          Live percentile
        </span>
      </div>
      <div className="mx-auto flex max-w-3xl items-end justify-center gap-2 sm:gap-5">
        {order.map((item, index) => (
          <div key={item.rank} className="flex flex-1 flex-col items-center">
            <div
              className={`mb-2 grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${item.rank === 1 ? "bg-[#ff9423] text-[#542200]" : "bg-white text-[#003d2e]"}`}
            >
              {item.rank === 1 ? <Trophy className="h-4 w-4" /> : item.rank}
            </div>
            <div className="w-full rounded-xl bg-white p-3 text-center shadow-lg">
              <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-[#eaf0ed] text-[11px] font-bold text-[#234238]">
                {initials(item.name)}
              </div>
              <p className="truncate text-xs font-bold text-[#15271f]">
                {nameOf(item.name)}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {item.accessCode || "Verified candidate"}
              </p>
              <p className="mt-2 text-lg font-bold text-[#004b37]">
                {subject !== null
                  ? `${item.subject?.best || 0} pts`
                  : `${item.averageScore.toFixed(1)}%`}
              </p>
            </div>
            <div
              className={`mt-2 w-full rounded-t-md bg-[#ff9423] ${heights[index]}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
