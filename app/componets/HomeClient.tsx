'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, CalendarDays, Clock3, FileText, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import DashboardHeader from './dashboard/DashboardHeader';
import StatCard from './dashboard/StatCard';
import { EXAM_DRAFTS_CHANGED, ExamDraft, readExamDrafts, removeExamDraft } from '../lib/examDrafts';

type PublishedExam = {
  id?: string;
  _id?: string;
  title: string;
  description?: string | null;
  examType?: string | null;
  isActive: boolean;
  totalPoints?: number;
  durationHours?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  createdAt?: string;
  questionSets?: Array<{ questionSetId: string; title: string; totalPoints?: number }>;
};

type FeedTab = 'all' | 'active' | 'inactive' | 'drafts';

function duration(hours?: number, minutes?: number, seconds?: number) {
  const parts = [hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', seconds ? `${seconds}s` : ''].filter(Boolean);
  return parts.join(' ') || 'No time limit';
}

function formattedDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Date unavailable' : date.toLocaleDateString();
}

function subjectSummary(exam: PublishedExam) {
  const titles = exam.questionSets?.map((set) => set.title).filter(Boolean) || [];
  return titles.length ? titles.join(' · ') : `${exam.questionSets?.length || 0} subjects`;
}

export default function HomeClient() {
  const [exams, setExams] = useState<PublishedExam[]>([]);
  const [drafts, setDrafts] = useState<ExamDraft[]>([]);
  const [tab, setTab] = useState<FeedTab>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshDrafts = useCallback(() => setDrafts(readExamDrafts()), []);
  const refreshExams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/quiz/feed', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to load exams.');
      setExams(Array.isArray(data.quizzes) ? data.quizzes : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load exams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDrafts();
    void refreshExams();
    window.addEventListener('storage', refreshDrafts);
    window.addEventListener(EXAM_DRAFTS_CHANGED, refreshDrafts);
    return () => {
      window.removeEventListener('storage', refreshDrafts);
      window.removeEventListener(EXAM_DRAFTS_CHANGED, refreshDrafts);
    };
  }, [refreshDrafts, refreshExams]);

  const activeCount = exams.filter((exam) => exam.isActive).length;
  const serverCount = (value: number) => loading || Boolean(error) ? '—' : String(value);
  const term = search.trim().toLowerCase();
  const shownExams = useMemo(() => exams.filter((exam) => {
    if (tab === 'drafts') return false;
    if (tab === 'active' && !exam.isActive) return false;
    if (tab === 'inactive' && exam.isActive) return false;
    return !term || [exam.title, exam.description || '', ...(exam.questionSets?.map((set) => set.title) || [])].some((part) => part.toLowerCase().includes(term));
  }), [exams, tab, term]);
  const shownDrafts = useMemo(() => drafts.filter((draft) =>
    (tab === 'all' || tab === 'drafts') && (!term || [draft.settings.title, draft.settings.description].some((part) => (part || '').toLowerCase().includes(term)))
  ), [drafts, tab, term]);

  const tabs: Array<{ id: FeedTab; label: string; count: number }> = [
    { id: 'all', label: 'All examinations', count: exams.length + drafts.length },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'inactive', label: 'Inactive', count: exams.length - activeCount },
    { id: 'drafts', label: 'Drafts', count: drafts.length },
  ];

  const deleteDraft = (id: string) => {
    if (!window.confirm('Delete this locally saved exam draft? This cannot be undone.')) return;
    try {
      removeExamDraft(id);
      refreshDrafts();
    } catch {
      setError('Unable to delete this draft from browser storage.');
    }
  };

  return <div className="min-h-screen bg-gray-50">
    <DashboardHeader adminName="Administrator" adminRole="Exam management" notificationCount={0} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search exams and drafts..." />
    <main className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-5 rounded-xl bg-gradient-to-br from-[#0d2818] to-[#12331e] p-6 text-white md:flex-row md:items-center md:p-8">
        <div><h1 className="mb-2 text-2xl font-bold md:text-3xl">Exam &amp; CBT Management</h1><p className="max-w-xl text-sm text-white/70">Review created exams, analyse candidate performance, and continue work on saved drafts.</p></div>
        <Link href="/create-quiz" className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-orange-600"><Plus className="h-4 w-4" /> Create New Exam</Link>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Exam summary">
        <StatCard label="CREATED EXAMS" value={serverCount(exams.length)} unit="total" icon={FileText} iconBg="bg-emerald-50" iconColor="text-emerald-700" footer="Exams stored in the backend" />
        <StatCard label="ACTIVE EXAMS" value={serverCount(activeCount)} unit="published" icon={BookOpen} iconBg="bg-orange-50" iconColor="text-orange-600" footer="Available to candidates" />
        <StatCard label="INACTIVE EXAMS" value={serverCount(exams.length - activeCount)} unit="inactive" icon={BarChart3} iconBg="bg-slate-100" iconColor="text-slate-600" footer="Still available for analysis" />
        <StatCard label="SAVED DRAFTS" value={String(drafts.length)} unit="local" icon={FileText} iconBg="bg-emerald-50" iconColor="text-emerald-700" footer="Saved in this browser only" />
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error} <button type="button" onClick={() => void refreshExams()} className="ml-2 font-semibold underline">Retry</button></div>}

      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
          {tabs.map((item) => <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${tab === item.id ? 'bg-[#0d2818] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{item.label} <span className="opacity-70">({item.count})</span></button>)}
        </div>
        <div className="flex gap-2"><label className="relative lg:hidden"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exams..." className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm" /></label><button type="button" onClick={() => { refreshDrafts(); void refreshExams(); }} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button></div>
      </div>

      {loading && <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading created exams…</p>}

      {!loading && shownExams.length + shownDrafts.length === 0 && <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center"><FileText className="mx-auto mb-3 h-9 w-9 text-[#0d4a36]" /><h2 className="font-semibold text-gray-900">{term ? 'No matching exams' : tab === 'drafts' ? 'No saved drafts yet' : 'No exams in this view'}</h2><p className="mt-1 text-sm text-gray-500">{term ? 'Try another search term.' : tab === 'drafts' ? 'Save an unfinished exam in the builder to continue it later.' : 'Create an exam to get started.'}</p></div>}

      {(shownDrafts.length > 0 || (!loading && shownExams.length > 0)) && <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Exam feed">
        {shownDrafts.map((draft) => {
          const selected = draft.selections.filter((selection) => selection.questionSetId).length;
          const target = draft.examType === 'single-subject' ? 1 : 4;
          return <article key={draft.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"><div className="h-1 bg-slate-400" /><div className="flex flex-1 flex-col p-5"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">EXAM DRAFT</span><span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">Saved locally</span></div><h2 className="text-base font-bold text-gray-900">{draft.settings.title.trim() || 'Untitled exam'}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-500">{draft.settings.description || 'Continue setting up this exam.'}</p><div className="mt-3 space-y-2 text-xs text-gray-600"><p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#0d4a36]" />{selected} of {target} subjects selected</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#0d4a36]" />{duration(draft.settings.duration?.hours, draft.settings.duration?.minutes, draft.settings.duration?.seconds)}</p><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#0d4a36]" />Saved {formattedDate(draft.updatedAt)}</p></div><div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4"><button type="button" onClick={() => deleteDraft(draft.id)} aria-label={`Delete ${draft.settings.title || 'untitled exam'} draft`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button><Link href={`/create-quiz?draft=${encodeURIComponent(draft.id)}`} className="rounded-lg bg-[#0d4a36] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0a3a2b]">Edit draft</Link></div></div></article>;
        })}
        {!loading && shownExams.map((exam) => {
          const id = exam.id || exam._id;
          return <article key={id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"><div className={`h-1 ${exam.isActive ? 'bg-orange-500' : 'bg-[#0d2818]'}`} /><div className="flex flex-1 flex-col p-5"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">CREATED EXAM</span><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${exam.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{exam.isActive ? 'Active' : 'Inactive'}</span></div><h2 className="text-base font-bold text-gray-900">{exam.title}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-500">{exam.description || subjectSummary(exam)}</p><div className="mt-3 space-y-2 text-xs text-gray-600"><p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#0d4a36]" /><span className="line-clamp-1">{subjectSummary(exam)}</span></p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#0d4a36]" />{duration(exam.durationHours, exam.durationMinutes, exam.durationSeconds)} · {exam.totalPoints || 0} points</p><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#0d4a36]" />Created {formattedDate(exam.createdAt)}</p></div><div className="mt-auto flex justify-end border-t border-gray-100 pt-4">{id && <Link href={`/analytics?quizId=${encodeURIComponent(id)}`} className="rounded-lg bg-[#0d4a36] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0a3a2b]">Analyse exam</Link>}</div></div></article>;
        })}
      </section>}
      <p className="text-xs text-gray-500">Drafts are saved only in this browser. Publish an exam from the builder to store it on the server.</p>
    </main>
  </div>;
}
