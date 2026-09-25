'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardTableLoading from '../../componets/dashboard/DashboardTableLoading';
import TopicTestDialog, { TestQuestion, TopicTest } from './TopicTestDialog';
import { ArrowLeft, BookOpen, Edit3, FileQuestion, Link2, Plus, Power, Upload } from 'lucide-react';

interface Topic { id: string; name: string; isActive: boolean; _count?: { questions: number }; tests?: TopicTest[] }
interface QuestionSet { id: string; title: string; questionCount: number; totalPoints: number; isActive: boolean; createdBy?: { email: string }; questions: TestQuestion[] }

export default function QuestionSetDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topicName, setTopicName] = useState('');
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [uploadTopic, setUploadTopic] = useState<Topic | null>(null);
  const [testTopicId, setTestTopicId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [setResponse, topicsResponse] = await Promise.all([fetch(`/api/questionset/${id}`, { cache: 'no-store' }), fetch(`/api/questionset/${id}/topics`, { cache: 'no-store' })]);
      const [setData, topicsData] = await Promise.all([setResponse.json(), topicsResponse.json()]);
      if (!setResponse.ok) throw new Error(setData.message || 'Could not load subject');
      if (!topicsResponse.ok) throw new Error(topicsData.message || 'Could not load topics');
      setSet({ ...setData.questionSet, id: setData.questionSet.id || setData.questionSet._id });
      setTopics((topicsData.topics || []).map((topic: Topic & { _id?: string }) => ({ ...topic, id: topic.id || topic._id || '' })));
      setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load subject'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { if (id) void refresh(); }, [id, refresh]);

  const createTopic = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!topicName.trim()) return;
    try { setSaving(true); const response = await fetch(`/api/questionset/${id}/topics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: topicName.trim() }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not create topic'); setTopicName(''); setNewTopicOpen(false); await refresh(); }
    catch (reason) { alert(reason instanceof Error ? reason.message : 'Could not create topic'); }
    finally { setSaving(false); }
  };
  const toggleTopic = async (topic: Topic) => {
    try { const response = await fetch(`/api/questionset/${id}/topics/${topic.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !topic.isActive }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); await refresh(); }
    catch (reason) { alert(reason instanceof Error ? reason.message : 'Could not update topic'); }
  };
  const upload = async (event: React.FormEvent) => {
    event.preventDefault(); if (!uploadTopic || !file) return;
    try { setSaving(true); const body = new FormData(); body.append('file', file); const response = await fetch(`/api/questionset/${id}/topics/${uploadTopic.id}/questions`, { method: 'POST', body }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not upload questions'); setUploadTopic(null); setFile(null); await refresh(); }
    catch (reason) { alert(reason instanceof Error ? reason.message : 'Could not upload questions'); }
    finally { setSaving(false); }
  };



  return <main className="min-h-screen bg-[#f5f7f6] px-4 py-5 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <button onClick={() => router.push('/question-set')} className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-[#31443a]"><ArrowLeft className="h-4 w-4" /> Back to subjects</button>
    <header className="rounded-xl border border-[#e5ebe8] bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><BookOpen className="h-7 w-7 text-[#004b37]" /><h1 className="text-2xl font-bold text-[#091d15]">{set?.title || 'Subject topics'}</h1></div><p className="mt-2 text-sm text-slate-500">{loading ? 'Loading subject details…' : set ? `${set.questionCount} questions · ${set.totalPoints} points · Curator: ${set.createdBy?.email || 'Portal administrator'}` : error || 'Subject not found'}</p></div><div className="flex flex-wrap gap-2"><Link href={`/question-set/${id}/questions`} className="inline-flex items-center gap-2 rounded-lg bg-[#e5eee7] px-4 py-2.5 text-sm font-semibold text-[#174a34]"><Edit3 className="h-4 w-4" /> Edit &amp; assign questions</Link><Link href={`/question-organizer?subjectId=${id}`} className="inline-flex items-center gap-2 rounded-lg bg-[#e5eee7] px-4 py-2.5 text-sm font-semibold text-[#174a34]"><Upload className="h-4 w-4" /> Organize pasted questions</Link><button disabled={loading || !set} onClick={() => setNewTopicOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#004b37] px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add topic</button></div></div></header>
    <section className="mt-5 rounded-xl border border-[#e5ebe8] bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold text-[#10231a]">Topics</h2><p className="mt-1 text-sm text-slate-500">Upload questions into a topic, then choose questions for a student topic test.</p></div>{loading ? <DashboardTableLoading label="Loading subject topics" /> : !set ? <p role="alert" className="p-5 text-sm text-red-700">{error || 'Subject not found'} <button type="button" onClick={() => void refresh()} className="font-semibold underline">Retry</button></p> : topics.length ? <div className="divide-y divide-slate-100">{topics.map((topic) => <article key={topic.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#edf4ef] text-[#004b37]"><FileQuestion className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="font-semibold text-[#13241c]">{topic.name}</h3><p className="mt-1 text-sm text-slate-500">{topic._count?.questions ?? 0} questions · {topic.tests?.length ?? 0} tests</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${topic.isActive ? 'bg-[#cef3e1] text-[#176148]' : 'bg-slate-100 text-slate-500'}`}>{topic.isActive ? 'Active' : 'Inactive'}</span><button onClick={() => setTestTopicId(topic.id)} disabled={!topic.isActive || !set.isActive} className="inline-flex items-center gap-1 rounded-lg bg-[#e5eee7] px-3 py-2 text-sm font-semibold text-[#174a34] disabled:opacity-50"><Link2 className="h-4 w-4" /> Topic tests</button><button onClick={() => setUploadTopic(topic)} disabled={!topic.isActive} className="inline-flex items-center gap-1 rounded-lg bg-[#edf0ef] px-3 py-2 text-sm font-medium text-[#263a30] disabled:opacity-50"><Upload className="h-4 w-4" /> Upload</button><button onClick={() => toggleTopic(topic)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Toggle topic"><Power className="h-4 w-4" /></button></article>)}</div> : <div className="p-12 text-center text-slate-500">No topics yet. Add a topic to begin organizing this subject.</div>}</section>
    {testTopicId && set && topics.some((topic) => topic.id === testTopicId) && <TopicTestDialog subjectId={id} topic={topics.find((topic) => topic.id === testTopicId)!} questions={set.questions || []} onClose={() => setTestTopicId(null)} onCreated={(test) => setTopics((current) => current.map((topic) => topic.id === testTopicId ? { ...topic, tests: [test, ...(topic.tests || [])] } : topic))} />}
    {newTopicOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"><form onSubmit={createTopic} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold text-[#13241c]">Add topic</h2><label className="mt-5 block text-sm font-medium text-slate-700">Topic name<input autoFocus value={topicName} onChange={(event) => setTopicName(event.target.value)} placeholder="e.g. Algebra" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" required /></label><div className="mt-6 flex gap-2"><button type="button" onClick={() => setNewTopicOpen(false)} className="flex-1 rounded-lg bg-slate-100 py-2.5 font-semibold">Cancel</button><button disabled={saving} className="flex-1 rounded-lg bg-[#004b37] py-2.5 font-semibold text-white">{saving ? 'Saving…' : 'Add topic'}</button></div></form></div>}
    {uploadTopic && <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"><form onSubmit={upload} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold text-[#13241c]">Upload to {uploadTopic.name}</h2><p className="mt-1 text-sm text-slate-500">Use the normal question CSV or Excel template.</p><input className="mt-5 block w-full text-sm" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setFile(event.target.files?.[0] || null)} required /><div className="mt-6 flex gap-2"><button type="button" onClick={() => setUploadTopic(null)} className="flex-1 rounded-lg bg-slate-100 py-2.5 font-semibold">Cancel</button><button disabled={saving} className="flex-1 rounded-lg bg-[#004b37] py-2.5 font-semibold text-white">{saving ? 'Uploading…' : 'Upload questions'}</button></div></form></div>}
  </div></main>;
}
