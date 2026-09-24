"use client";

import Link from "next/link";
import { CalendarDays, Clock3, FileText, Plus, RefreshCw, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Exam = {
  id?: string;
  _id?: string;
  title: string;
  description?: string | null;
  examType?: string | null;
  isActive?: boolean;
  totalPoints?: number;
  createdAt?: string;
  createdBy?: { email?: string | null } | null;
  durationHours?: number | null;
  durationMinutes?: number | null;
  durationSeconds?: number | null;
  questionSets?: Array<{ questionSetId?: string; title?: string; totalPoints?: number }>;
};

function formatDuration(exam: Exam) {
  const parts = [
    exam.durationHours ? `${exam.durationHours}h` : "",
    exam.durationMinutes ? `${exam.durationMinutes}m` : "",
    exam.durationSeconds && !exam.durationHours && !exam.durationMinutes ? `${exam.durationSeconds}s` : "",
  ].filter(Boolean);

  return parts.join(" ") || "No time limit";
}

export default function Explore() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quiz/feed", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load the exam library.");
      }

      setExams(Array.isArray(payload.quizzes) ? payload.quizzes : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the exam library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0d2818]">Exam Library</h2>
          <p className="mt-1 text-sm text-slate-500">Browse exams and manage the content available to candidates.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadExams()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dce7e1] bg-white px-3 py-2.5 text-sm font-semibold text-[#0d4a36] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <Link href="/create-quiz" className="inline-flex items-center gap-2 rounded-lg bg-[#0d4a36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3a2b]">
            <Plus className="h-4 w-4" /> Create New Exam
          </Link>
        </div>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {loading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-xl bg-slate-100" />)}
        </section>
      ) : exams.length === 0 ? (
        <section className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-[#e5ebe8] bg-white px-6 py-12 text-center shadow-sm">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#eaf4ee] text-[#0d6449]"><FileText className="h-8 w-8" /></div>
          <h3 className="text-xl font-semibold text-[#0d2818]">It&apos;s a little quiet here</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Create an exam to see it appear in this library.</p>
          <Link href="/create-quiz" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0d4a36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3a2b]"><Plus className="h-4 w-4" /> Create New Exam</Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => {
            const examId = exam.id || exam._id;
            const subjectCount = exam.questionSets?.length || 0;
            return <article key={examId} className="flex min-h-56 flex-col rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${exam.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{exam.isActive ? "Active" : "Inactive"}</span>{exam.examType && <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{exam.examType}</span>}</div>
              <h3 className="mt-4 text-lg font-bold text-[#0d2818]">{exam.title}</h3>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">{exam.description || "No description has been added yet."}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#edf1ef] pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[#0d6449]" />{formatDuration(exam)}</span>
                <span className="flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5 text-[#0d6449]" />{subjectCount} subject{subjectCount === 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-[#0d6449]" />{exam.totalPoints || 0} points</span>
                {exam.createdAt && <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#0d6449]" />{new Date(exam.createdAt).toLocaleDateString()}</span>}
              </div>
              <div className="mt-auto flex items-center justify-between pt-5 text-xs text-slate-400"><span className="truncate pr-3">{exam.createdBy?.email || "Administrator"}</span>{examId && <Link href={`/analytics?quizId=${encodeURIComponent(examId)}`} className="font-semibold text-[#0d6449] hover:underline">Analyse exam</Link>}</div>
            </article>;
          })}
        </section>
      )}
    </main>
  );
}
