'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Search, X } from 'lucide-react';

export type TopicTest = { id: string; title: string; questionIds: string[]; studentPath?: string };
export type TopicForTest = { id: string; name: string; tests?: TopicTest[] };
export type TestQuestion = { id: string; topicId?: string | null; question: string; type: string; orderNum: number; isArchived: boolean; points: number };

const supported = new Set(['multiple-choice', 'true-false', 'fill-in-the-blank', 'fill-in-the-blanks']);

export default function TopicTestDialog({ subjectId, topic, questions, onClose, onCreated }: {
  subjectId: string;
  topic: TopicForTest;
  questions: TestQuestion[];
  onClose: () => void;
  onCreated: (test: TopicTest) => void;
}) {
  const [title, setTitle] = useState(`${topic.name} test`);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [studentSite, setStudentSite] = useState(() => {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_STUDENT_SITE_URL || '';
    return window.localStorage.getItem('bjot.student-site-url') || process.env.NEXT_PUBLIC_STUDENT_SITE_URL || '';
  });

  const available = useMemo(() => questions.filter((question) => question.topicId === topic.id && !question.isArchived && supported.has(question.type)), [questions, topic.id]);
  const visible = useMemo(() => available.filter((question) => question.question.toLowerCase().includes(query.trim().toLowerCase())), [available, query]);
  const selectedSet = new Set(selected);
  const visibleAllSelected = visible.length > 0 && visible.every((question) => selectedSet.has(question.id));
  const tests = topic.tests || [];

  const studentLink = (test: TopicTest) => {
    const origin = studentSite.trim();
    if (!origin) throw new Error('Enter the student site URL before copying a link.');
    let url: URL;
    try { url = new URL(origin); } catch { throw new Error('Enter a valid student site URL, including https://.'); }
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Enter an http or https student site URL.');
    return new URL(test.studentPath || `/topic-test?topicId=${test.id}`, url.origin).toString();
  };

  const copyLink = async (test: TopicTest) => {
    try {
      const link = studentLink(test);
      await navigator.clipboard.writeText(link);
      setCopied(test.id); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not copy the link'); }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected.length) return setError('Select at least one question.');
    if (selected.length > 500) return setError('Select no more than 500 questions.');
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/questionset/${subjectId}/topics/${topic.id}/tests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), questionIds: selected }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create topic test');
      onCreated(data.test);
      setSelected([]); setTitle(`${topic.name} test`);
      setCopied('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create topic test'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-3 sm:p-6">
    <div role="dialog" aria-modal="true" aria-label={`Topic tests for ${topic.name}`} className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5"><div><h2 className="text-xl font-bold text-[#13241c]">Topic tests · {topic.name}</h2><p className="mt-1 text-sm text-slate-500">Choose the questions students will receive, then create a shareable test link.</p></div><button type="button" onClick={onClose} aria-label="Close topic tests" className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
      <div className="overflow-y-auto p-5">
        <label className="block text-sm font-semibold text-[#31443a]">Student site URL<input value={studentSite} onChange={(event) => { setStudentSite(event.target.value); window.localStorage.setItem('bjot.student-site-url', event.target.value); }} placeholder="https://your-student-site.example" type="url" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <p className="mt-1 text-xs text-slate-500">Used to copy full links. Saved in this browser.</p>
        {!!tests.length && <section className="mt-5"><h3 className="text-sm font-bold text-[#13241c]">Created tests</h3><div className="mt-2 divide-y rounded-lg border border-slate-200">{tests.map((test) => <div key={test.id} className="flex flex-wrap items-center justify-between gap-2 p-3"><div><p className="text-sm font-semibold">{test.title}</p><p className="text-xs text-slate-500">{test.questionIds.length} questions</p></div><button type="button" onClick={() => void copyLink(test)} className="inline-flex items-center gap-1 rounded-lg border border-[#bdd8c5] px-3 py-1.5 text-sm font-semibold text-[#165438]">{copied === test.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied === test.id ? 'Copied' : 'Copy link'}</button></div>)}</div></section>}
        <form onSubmit={create} className="mt-6 border-t border-slate-100 pt-5"><h3 className="text-sm font-bold text-[#13241c]">Create a new test</h3>
          <label className="mt-3 block text-sm font-semibold text-[#31443a]">Test title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" /></label><span className="text-sm font-semibold text-[#24573b]">{selected.length} selected</span></div>
          <label className="mt-3 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={visibleAllSelected} disabled={!visible.length} onChange={(event) => setSelected((current) => event.target.checked ? Array.from(new Set([...current, ...visible.map((question) => question.id)])) : current.filter((id) => !visible.some((question) => question.id === id)))} /> Select all shown</label>
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200">{visible.length ? visible.map((question) => <label key={question.id} className="flex cursor-pointer gap-3 border-b border-slate-100 p-3 text-sm last:border-b-0 hover:bg-slate-50"><input type="checkbox" checked={selectedSet.has(question.id)} onChange={() => setSelected((current) => current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id])} /><span><span className="font-semibold">#{question.orderNum}</span> {question.question}<span className="mt-1 block text-xs text-slate-500">{question.type.replaceAll('-', ' ')} · {question.points} point{question.points === 1 ? '' : 's'}</span></span></label>) : <p className="p-4 text-sm text-slate-500">No eligible questions found. Add active, automatically graded questions to this topic first.</p>}</div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold">Close</button><button disabled={saving || !selected.length || !title.trim()} className="rounded-lg bg-[#004b37] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create test'}</button></div>
        </form>
      </div>
    </div>
  </div>;
}
