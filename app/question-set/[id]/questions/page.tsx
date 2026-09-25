'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardTableLoading from '../../../componets/dashboard/DashboardTableLoading';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Edit3, Plus, Search, X } from 'lucide-react';
import { buildQuestionUpdate, optionValues, QuestionDraft, StoredQuestion, toDraft } from './questionEditor';

type Topic = { id: string; name: string; isActive: boolean };
type QuestionSet = { id: string; title: string; questions: StoredQuestion[]; topics: Topic[] };
const inputClass = 'w-full rounded-lg border border-[#d5e1d8] bg-white px-3 py-2.5 text-sm text-[#15291f] outline-none focus:border-[#176a47] focus:ring-2 focus:ring-[#176a47]/15';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4d6656]';
const PAGE_SIZE = 25;

export default function ManageQuestions() {
  const { id } = useParams<{ id: string }>();
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignTopic, setAssignTopic] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [editing, setEditing] = useState<StoredQuestion | null>(null);
  const [draft, setDraft] = useState<QuestionDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [setResponse, topicsResponse] = await Promise.all([
        fetch(`/api/questionset/${id}`, { cache: 'no-store' }),
        fetch(`/api/questionset/${id}/topics`, { cache: 'no-store' }),
      ]);
      const [setData, topicsData] = await Promise.all([setResponse.json(), topicsResponse.json()]);
      if (!setResponse.ok) throw new Error(setData.message || 'Could not load subject');
      if (!topicsResponse.ok) throw new Error(topicsData.message || 'Could not load topics');
      setSet(setData.questionSet);
      setTopics(topicsData.topics || []);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load questions');
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void refresh(); }, [refresh]);

  const questions = useMemo(() => set?.questions || [], [set]);
  const unassignedCount = questions.filter((question) => !question.topicId && !question.isArchived).length;
  const filtered = useMemo(() => questions.filter((question) => {
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'archived' ? question.isArchived : !question.isArchived);
    const matchesTopic = topicFilter === 'all' || (topicFilter === 'unassigned' ? !question.topicId : question.topicId === topicFilter);
    const haystack = [question.question, ...optionValues(question.options)].join(' ').toLowerCase();
    return matchesStatus && matchesTopic && haystack.includes(query.trim().toLowerCase());
  }), [questions, query, topicFilter, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shownPage = Math.min(page, pageCount);
  const visible = filtered.slice((shownPage - 1) * PAGE_SIZE, shownPage * PAGE_SIZE);
  const visibleSelected = visible.length > 0 && visible.every((question) => selectedIds.includes(question.id));
  const topicName = (topicId?: string | null) => topics.find((topic) => topic.id === topicId)?.name || 'Unassigned';

  const toggleSelected = (questionId: string) => setSelectedIds((current) => current.includes(questionId) ? current.filter((item) => item !== questionId) : [...current, questionId]);
  const selectVisible = (checked: boolean) => setSelectedIds((current) => checked
    ? Array.from(new Set([...current, ...visible.map((question) => question.id)]))
    : current.filter((item) => !visible.some((question) => question.id === item)));

  const createTopic = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTopic.trim()) return;
    setError(''); setMessage(''); setCreatingTopic(true);
    try {
      const response = await fetch(`/api/questionset/${id}/topics`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTopic.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create topic');
      setTopics((current) => [...current, data.topic].sort((a, b) => a.name.localeCompare(b.name)));
      setAssignTopic(data.topic.id);
      setNewTopic('');
      setMessage(`Topic "${data.topic.name}" created. Select questions to assign it.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create topic'); }
    finally { setCreatingTopic(false); }
  };

  const assignSelected = async () => {
    if (!selectedIds.length || !assignTopic) return;
    if (selectedIds.length > 100) return setError('Assign up to 100 questions at a time.');
    setError(''); setMessage(''); setAssigning(true);
    try {
      const topicId = assignTopic === '__unassigned__' ? null : assignTopic;
      const response = await fetch(`/api/questionset/${id}/questions/assign-topic`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionIds: selectedIds, topicId }),
      });
      const data = await response.json();
      const updated = new Set<string>(data.updatedIds || []);
      if (updated.size) {
        setSet((current) => current ? { ...current, questions: current.questions.map((question) => updated.has(question.id) ? { ...question, topicId } : question) } : current);
      }
      setSelectedIds(data.failedIds || []);
      if (!response.ok || !data.success) throw new Error(data.message || 'Some questions could not be assigned');
      setMessage(data.message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not assign topics'); }
    finally { setAssigning(false); }
  };

  const openEditor = (question: StoredQuestion) => { setEditing(question); setDraft(toDraft(question)); setEditError(''); };
  const closeEditor = () => { if (!saving) { setEditing(null); setDraft(null); setEditError(''); } };
  const changeDraft = (change: Partial<QuestionDraft>) => setDraft((current) => current ? { ...current, ...change } : current);
  const saveQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !draft) return;
    setEditError('');
    const { changes, errors } = buildQuestionUpdate(editing, draft);
    if (errors.length) return setEditError(errors.join(' '));
    if (!Object.keys(changes).length) return closeEditor();
    if (changes.topicId && topics.some((topic) => topic.id === changes.topicId && !topic.isActive)) return setEditError('Choose an active topic.');
    try {
      setSaving(true);
      const response = await fetch(`/api/questionset/${id}/questions/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save question');
      setSet(data.questionSet);
      setEditing(null); setDraft(null);
      setMessage('Question saved.');
      setError('');
    } catch (reason) { setEditError(reason instanceof Error ? reason.message : 'Could not save question'); }
    finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-[#f5f7f6] px-4 py-6 text-[#142b1f] sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href={`/question-set/${id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#466451]"><ArrowLeft className="h-4 w-4" /> Back to subject</Link>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a44b0b]">Question bank</p><h1 className="mt-1 text-3xl font-bold">Edit questions</h1><p className="mt-2 text-sm text-[#607466]">{set?.title || 'Subject'} · {loading ? '—' : questions.length} questions · {loading ? '—' : unassignedCount} active questions without a topic</p></div><Link href={`/question-organizer?subjectId=${id}`} className="inline-flex items-center gap-2 rounded-lg bg-[#064e37] px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add questions</Link></header>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><Check className="mr-2 inline h-4 w-4" />{message}</div>}
      {!set && !loading ? <div className="rounded-xl border bg-white p-8 text-center text-sm">Could not load this subject. <button onClick={() => void refresh()} className="font-semibold underline">Retry</button></div> : <>
        <section className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-xl border border-[#e0e9e2] bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Find questions</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#6b8171]" /><input aria-label="Search questions" className={`${inputClass} pl-9`} placeholder="Search question text" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div><select aria-label="Filter by topic" className={inputClass} value={topicFilter} onChange={(event) => { setTopicFilter(event.target.value); setPage(1); }}><option value="all">All topics</option><option value="unassigned">Unassigned ({loading ? "—" : unassignedCount})</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select><select aria-label="Filter by status" className={inputClass} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="active">Active questions</option><option value="archived">Archived questions</option><option value="all">All statuses</option></select></div><p className="mt-3 text-xs text-[#718174]">Showing {loading ? "—" : filtered.length} matching questions. Select the questions on a page to assign a topic in bulk.</p></div>
          <form onSubmit={createTopic} className="rounded-xl border border-[#e0e9e2] bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Add a topic</h2><label className={`${labelClass} mt-4`} htmlFor="new-topic-name">Topic name</label><div className="flex gap-2"><input id="new-topic-name" className={inputClass} maxLength={255} placeholder="e.g. Mechanics" value={newTopic} onChange={(event) => setNewTopic(event.target.value)} /><button disabled={loading || creatingTopic || !newTopic.trim()} className="rounded-lg bg-[#e3efe6] px-3 font-semibold text-[#14583c] disabled:opacity-50">Add</button></div></form>
        </section>
        <section className="rounded-xl border border-[#e0e9e2] bg-white shadow-sm"><div className="flex flex-wrap items-end gap-3 border-b border-[#e6eee8] p-4"><label className="flex items-center gap-2 pb-2 text-sm font-medium"><input type="checkbox" checked={visibleSelected} onChange={(event) => selectVisible(event.target.checked)} /> Select page</label><span className="pb-2 text-sm text-[#667b6b]">{selectedIds.length} selected</span><div className="min-w-[220px] flex-1"><label className={labelClass} htmlFor="assign-topic">Assign selected to</label><select id="assign-topic" className={inputClass} value={assignTopic} onChange={(event) => setAssignTopic(event.target.value)}><option value="">Choose topic</option><option value="__unassigned__">Unassigned</option>{topics.filter((topic) => topic.isActive).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></div><button type="button" onClick={assignSelected} disabled={!selectedIds.length || !assignTopic || assigning} className="rounded-lg bg-[#064e37] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{assigning ? 'Assigning…' : 'Assign topic'}</button></div>
          {loading ? <DashboardTableLoading label="Loading questions" /> : visible.length ? <div className="divide-y divide-[#e8eee9]">{visible.map((question) => <article key={question.id} className="flex gap-3 p-4 hover:bg-[#fafcfb]"><input aria-label={`Select question ${question.orderNum}`} type="checkbox" className="mt-1" checked={selectedIds.includes(question.id)} onChange={() => toggleSelected(question.id)} /><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[#65786a]"><span className="font-bold">#{question.orderNum}</span><span className="rounded-full bg-[#ebf2ed] px-2 py-0.5 font-semibold text-[#24573b]">{topicName(question.topicId)}</span><span>{question.type.replaceAll('-', ' ')}</span>{question.isArchived && <span className="rounded-full bg-slate-100 px-2 py-0.5">Archived</span>}</div><p className="line-clamp-2 text-sm font-medium leading-6">{question.question}</p><p className="mt-1 text-xs text-[#768679]">{question.points} point{question.points === 1 ? '' : 's'}{question.type === 'multiple-choice' ? ` · ${optionValues(question.options).length} options` : ''}</p></div><button type="button" onClick={() => openEditor(question)} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-[#d7e3da] px-3 text-sm font-semibold text-[#195739]"><Edit3 className="h-4 w-4" /><span className="hidden sm:inline">Edit</span></button></article>)}</div> : <div className="p-12 text-center text-sm text-[#6c7e70]">No questions match these filters.</div>}
          <div className="flex items-center justify-between gap-3 border-t border-[#e6eee8] p-4 text-sm"><span>Page {loading ? "—" : shownPage} of {loading ? "—" : pageCount}</span><div className="flex gap-2"><button type="button" disabled={shownPage <= 1} onClick={() => setPage(shownPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={shownPage >= pageCount} onClick={() => setPage(shownPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>
      </>}
    </div>

    {editing && draft && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-3 sm:p-6"><form onSubmit={saveQuestion} role="dialog" aria-modal="true" aria-label={`Edit question ${editing.orderNum}`} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#ad540d]">Question #{editing.orderNum}</p><h2 className="text-2xl font-bold">Edit question</h2><p className="mt-1 text-sm capitalize text-[#687b6d]">{editing.type.replaceAll('-', ' ')}</p></div><button type="button" onClick={closeEditor} aria-label="Close editor" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
      {editError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{editError}</div>}
      <div className="grid gap-4"><div><label className={labelClass} htmlFor="edit-question">Question text</label><textarea id="edit-question" rows={3} className={inputClass} value={draft.question} onChange={(event) => changeDraft({ question: event.target.value })} /></div>
        {editing.type === 'multiple-choice' ? <><div className="grid gap-3 sm:grid-cols-2">{draft.options.map((option, index) => <div key={index}><label className={labelClass} htmlFor={`edit-option-${index}`}>Option {String.fromCharCode(65 + index)}</label><div className="flex gap-2"><input id={`edit-option-${index}`} className={inputClass} value={option} onChange={(event) => changeDraft({ options: draft.options.map((item, position) => position === index ? event.target.value : item) })} /><button type="button" aria-label={`Remove option ${index + 1}`} disabled={draft.options.length <= 2} onClick={() => changeDraft({ options: draft.options.filter((_, position) => position !== index), answerIndex: draft.answerIndex === index ? -1 : draft.answerIndex > index ? draft.answerIndex - 1 : draft.answerIndex })} className="rounded-lg border px-2 text-red-700 disabled:opacity-30"><X className="h-4 w-4" /></button></div></div>)}</div><div className="flex flex-wrap items-end gap-3"><button type="button" onClick={() => changeDraft({ options: [...draft.options, ''] })} className="rounded-lg border border-[#d7e3da] px-3 py-2 text-sm font-semibold"><Plus className="mr-1 inline h-4 w-4" /> Option</button><div className="min-w-[220px] flex-1"><label className={labelClass} htmlFor="edit-answer">Correct answer</label><select id="edit-answer" className={inputClass} value={draft.answerIndex} onChange={(event) => changeDraft({ answerIndex: Number(event.target.value) })}><option value={-1}>Choose an option</option>{draft.options.map((option, index) => <option key={index} value={index}>{String.fromCharCode(65 + index)} · {option.slice(0, 70)}</option>)}</select></div></div>{draft.answerIndex < 0 && <p className="text-xs text-amber-800">The stored answer does not match an option. Choose one before changing the options.</p>}</> : editing.type === 'true-false' ? <div><label className={labelClass} htmlFor="edit-answer">Correct answer</label><select id="edit-answer" className={inputClass} value={draft.answerText.toLowerCase()} onChange={(event) => changeDraft({ answerText: event.target.value })}><option value="">Choose answer</option><option value="true">True</option><option value="false">False</option></select></div> : <div><label className={labelClass} htmlFor="edit-answer">Correct answer or marking guide</label><textarea id="edit-answer" rows={2} className={inputClass} value={draft.answerText} onChange={(event) => changeDraft({ answerText: event.target.value })} /></div>}
        <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass} htmlFor="edit-topic">Topic</label><select id="edit-topic" className={inputClass} value={draft.topicId} onChange={(event) => changeDraft({ topicId: event.target.value })}><option value="">Unassigned</option>{topics.map((topic) => <option key={topic.id} value={topic.id} disabled={!topic.isActive && topic.id !== editing.topicId}>{topic.name}{!topic.isActive ? ' (inactive)' : ''}</option>)}</select></div><div><label className={labelClass} htmlFor="edit-points">Points</label><input id="edit-points" type="number" min={1} max={1000} className={inputClass} value={draft.points} onChange={(event) => changeDraft({ points: Number(event.target.value) })} /></div></div>
        <div><label className={labelClass} htmlFor="edit-explanation">Explanation</label><textarea id="edit-explanation" rows={3} className={inputClass} value={draft.explanation} onChange={(event) => changeDraft({ explanation: event.target.value })} /></div>
        <details className="rounded-lg border border-[#e1e9e2] p-4"><summary className="cursor-pointer text-sm font-semibold">Passage and diagram</summary><div className="mt-4 grid gap-4"><div><label className={labelClass} htmlFor="edit-passage">Reading passage</label><textarea id="edit-passage" rows={3} className={inputClass} value={draft.passage} onChange={(event) => changeDraft({ passage: event.target.value })} /></div><div><label className={labelClass} htmlFor="edit-diagram">Diagram URL</label><input id="edit-diagram" className={inputClass} value={draft.diagram} onChange={(event) => changeDraft({ diagram: event.target.value })} /></div><div><label className={labelClass} htmlFor="edit-diagram-alt">Diagram description</label><input id="edit-diagram-alt" className={inputClass} value={draft.diagramAlt} onChange={(event) => changeDraft({ diagramAlt: event.target.value })} /></div></div></details>
      </div><div className="mt-6 flex justify-end gap-2 border-t border-[#e6eee8] pt-5"><button type="button" onClick={closeEditor} className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className="rounded-lg bg-[#064e37] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form></div>}
  </main>;
}
