"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, FileCheck2, Upload } from "lucide-react";

type Subject = { _id: string; title: string; isActive: boolean };
type Paper = { id: string; year: number; subjectId: string; subjectTitle: string; version: number; isPublished: boolean; questionCount: number; durationSeconds: number; availableQuestions?: number; questions?: Question[] };
type Question = { id: string; sourceRow: number; orderNum: number; question: string; passage: string; options: string[]; correctAnswer: string; explanation: string; mediaUrl: string | null; mediaAlt: string };
type RowError = { row: number; message: string };
type Preview = { valid: boolean; rowCount: number; errors: RowError[]; preview: Omit<Question, "id" | "orderNum">[] };
type Edit = { question: string; passage: string; options: string[]; correctAnswer: string; explanation: string; mediaUrl: string; mediaAlt: string };

async function read<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/past-questions/admin/${path}`, { ...init, cache: "no-store" });
  const data: T & { success?: boolean; message?: string; errors?: RowError[] } = await response.json();
  if (!response.ok || !data.success) throw Object.assign(new Error(data.message || "Request failed"), { errors: data.errors || [] });
  return data;
}
const inputClass = "mt-1 w-full rounded-lg border border-[#dce5df] bg-white px-3 py-2 text-sm text-[#17231e]";

export default function PastQuestionAdmin() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [year, setYear] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const setResponse = await fetch("/api/questionset?isActive=true", { cache: "no-store" }).then((response) => response.json()) as { success: boolean; questionSets: Subject[]; message?: string };
      if (!setResponse.success) throw new Error(setResponse.message || "Could not load subjects");
      setSubjects(setResponse.questionSets.filter((item) => item.isActive));
      const paperResponse = await read<{ papers: Paper[] }>("papers");
      setPapers(paperResponse.papers);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load papers"); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const openPaper = async (id: string) => {
    try { setBusy(true); setError(""); const data = await read<{ paper: Paper }>(`papers/${id}`); setPaper(data.paper); setEditingId(null); setPage(0); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open paper"); }
    finally { setBusy(false); }
  };
  const run = async (action: () => Promise<void>) => {
    try { setBusy(true); setError(""); setRowErrors([]); setNotice(""); await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); setRowErrors((cause as { errors?: RowError[] }).errors || []); }
    finally { setBusy(false); }
  };
  const selectedFile = () => {
    if (!year || !/^\d{4}$/.test(year) || Number(year) < 1970 || Number(year) > new Date().getFullYear()) throw new Error("Enter a valid exam year");
    if (!subjectId) throw new Error("Choose a subject");
    if (!file || !file.name.toLowerCase().endsWith(".csv") || file.size > 5 * 1024 * 1024) throw new Error("Choose a CSV file of at most 5 MB");
    const body = new FormData(); body.set("file", file); body.set("year", year); body.set("subjectId", subjectId);
    return body;
  };
  const previewFile = () => void run(async () => {
    const data = await read<Preview>("preview", { method: "POST", body: selectedFile() });
    setPreview(data); setRowErrors(data.errors);
    setNotice(data.valid ? `${data.rowCount} rows validated. Import creates an unpublished draft.` : `${data.errors.length} issue(s) found. Correct the CSV and preview again.`);
  });
  const importFile = () => void run(async () => {
    const data = await read<{ paper: Paper }>("papers/import", { method: "POST", body: selectedFile() });
    setPreview(null); setFile(null); setNotice("Draft imported. Review all questions, then publish.");
    await refresh(); await openPaper(data.paper.id);
  });
  const changePublication = (next: boolean) => {
    if (!paper) return;
    void run(async () => {
      await read(`papers/${paper.id}/publication`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublished: next }) });
      setNotice(next ? "Paper published. Any older version for this year and subject was unpublished." : "Paper unpublished.");
      await refresh(); await openPaper(paper.id);
    });
  };
  const startEdit = (question: Question) => { setEditingId(question.id); setEdit({ question: question.question, passage: question.passage, options: [...question.options], correctAnswer: question.correctAnswer, explanation: question.explanation, mediaUrl: question.mediaUrl || "", mediaAlt: question.mediaAlt }); };
  const saveEdit = () => {
    if (!paper || !editingId || !edit) return;
    void run(async () => {
      await read(`papers/${paper.id}/questions/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
      setEditingId(null); setEdit(null); setNotice("Question saved."); await openPaper(paper.id);
    });
  };
  const visibleQuestions = paper?.questions?.slice(page * 20, page * 20 + 20) || [];

  return <main className="mx-auto max-w-7xl px-4 py-7 text-[#17231e] sm:px-6">
    <header><p className="text-xs text-slate-500">Admin Portal <ChevronRight className="inline size-3" /> JAMB Past Questions</p><h1 className="mt-2 text-3xl font-bold">JAMB Past Questions</h1><p className="mt-2 text-sm text-slate-600">Import, check, correct, and publish separate year and subject papers.</p></header>
    {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-6"><section className="rounded-xl border border-[#dce5df] bg-white p-5"><div className="flex items-center gap-2"><Upload className="size-5 text-[#15513e]" /><h2 className="font-bold">Upload a paper</h2></div><p className="mt-2 text-xs text-slate-600">Use a single year CSV. The combined 1978–2026 files and cleaning logs are not paper files.</p>
        <label className="mt-4 block text-xs font-semibold">Exam year<input className={inputClass} type="number" min="1970" max={new Date().getFullYear()} value={year} onChange={(event) => { setYear(event.target.value); setPreview(null); }} /></label>
        <label className="mt-3 block text-xs font-semibold">Subject<select className={inputClass} value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setPreview(null); }}><option value="">Choose a subject</option>{subjects.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label>
        <label className="mt-3 block text-xs font-semibold">Question CSV<input className={inputClass} type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setPreview(null); }} /></label>
        <div className="mt-3 flex gap-4 text-xs font-semibold text-[#15513e]"><a className="underline" href="/templates/jamb-past-questions-template.csv" download>Download template</a><a className="underline" href="/templates/jamb-past-questions-sample.csv" download>Download sample</a></div>
        <div className="mt-5 flex gap-2"><button disabled={busy} onClick={previewFile} className="rounded-lg border border-[#15513e] px-4 py-2 text-sm font-bold text-[#15513e] disabled:opacity-50">Validate & preview</button><button disabled={busy || !preview?.valid} onClick={importFile} className="rounded-lg bg-[#0d3b2e] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Import draft</button></div>
        {preview && <div className="mt-4 rounded-lg bg-[#f4f7f5] p-3 text-xs"><strong>{preview.rowCount} rows</strong><p>{preview.valid ? "Ready to import" : "Fix the issues below"}</p>{preview.preview.map((item, index) => <p className="mt-2 truncate" key={index}>{item.sourceRow}. {item.question}</p>)}</div>}
        {!!rowErrors.length && <div className="mt-4 max-h-64 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-800" role="alert"><strong>{rowErrors.length} row issue(s)</strong><ul className="mt-2 list-inside list-disc">{rowErrors.map((item, index) => <li key={index}>Row {item.row}: {item.message}</li>)}</ul></div>}
      </section><section className="rounded-xl border border-[#dce5df] bg-white p-5"><h2 className="font-bold">Paper versions</h2><p className="mt-1 text-xs text-slate-600">Importing again creates a draft. Publishing it safely retires the previous version.</p><div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto">{papers.map((item) => <button key={item.id} onClick={() => void openPaper(item.id)} className={`w-full rounded-lg border p-3 text-left text-sm ${paper?.id === item.id ? "border-[#15513e] bg-[#edf7f0]" : "border-[#dce5df]"}`}><strong>{item.year} · {item.subjectTitle}</strong><span className="block text-xs text-slate-500">Version {item.version} · {item.availableQuestions ?? item.questionCount} rows · {item.isPublished ? "Published" : "Draft"}</span></button>)}</div>{!papers.length && <p className="mt-3 text-sm text-slate-500">No paper versions yet.</p>}</section></aside>
      <section className="min-w-0 rounded-xl border border-[#dce5df] bg-white p-5">{paper ? <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#15513e]">{paper.year} · {paper.subjectTitle} · version {paper.version}</p><h2 className="mt-1 text-xl font-bold">Review paper</h2><p className="text-sm text-slate-600">{paper.questions?.length ?? 0} questions · {paper.questionCount} used in premium practice · {paper.durationSeconds / 60} minutes</p></div><button disabled={busy} onClick={() => changePublication(!paper.isPublished)} className={`rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 ${paper.isPublished ? "border border-red-300 text-red-700" : "bg-[#0d3b2e] text-white"}`}>{paper.isPublished ? "Unpublish" : "Publish paper"}</button></div>
        <p className="mt-4 rounded-lg bg-[#f4f7f5] p-3 text-xs text-slate-600">To replace this paper, upload the corrected CSV for the same year and subject. Review the new draft, then publish it. Existing attempts keep their original questions.</p>
        <div className="mt-5 space-y-4">{visibleQuestions.map((item) => <article key={item.id} className="rounded-lg border border-[#dce5df] p-4"><p className="text-xs font-bold text-[#15513e]">Question {item.orderNum} · CSV row {item.sourceRow}</p>{editingId === item.id && edit ? <div className="mt-3 space-y-3"><label className="block text-xs font-semibold">Passage<textarea className={inputClass} rows={3} value={edit.passage} onChange={(event) => setEdit({ ...edit, passage: event.target.value })} /></label><label className="block text-xs font-semibold">Question<textarea className={inputClass} rows={3} value={edit.question} onChange={(event) => setEdit({ ...edit, question: event.target.value })} /></label>{edit.options.map((option, index) => <label key={index} className="block text-xs font-semibold">Option {String.fromCharCode(65 + index)}<input className={inputClass} value={option} onChange={(event) => setEdit({ ...edit, options: edit.options.map((value, optionIndex) => index === optionIndex ? event.target.value : value) })} /></label>)}<label className="block text-xs font-semibold">Correct option<select className={inputClass} value={edit.correctAnswer} onChange={(event) => setEdit({ ...edit, correctAnswer: event.target.value })}>{edit.options.map((option, index) => <option key={index} value={option}>{String.fromCharCode(65 + index)}: {option}</option>)}</select></label><label className="block text-xs font-semibold">Explanation<textarea className={inputClass} rows={3} value={edit.explanation} onChange={(event) => setEdit({ ...edit, explanation: event.target.value })} /></label><label className="block text-xs font-semibold">Media URL (HTTPS)<input className={inputClass} value={edit.mediaUrl} onChange={(event) => setEdit({ ...edit, mediaUrl: event.target.value })} /></label><label className="block text-xs font-semibold">Media alternative text<input className={inputClass} value={edit.mediaAlt} onChange={(event) => setEdit({ ...edit, mediaAlt: event.target.value })} /></label><div className="flex gap-2"><button disabled={busy} onClick={saveEdit} className="rounded-lg bg-[#0d3b2e] px-4 py-2 text-xs font-bold text-white">Save correction</button><button onClick={() => { setEditingId(null); setEdit(null); }} className="rounded-lg border px-4 py-2 text-xs font-bold">Cancel</button></div></div> : <><p className="mt-2 whitespace-pre-wrap text-sm font-semibold">{item.question}</p>{item.passage && <p className="mt-2 whitespace-pre-wrap border-l-2 border-emerald-200 pl-3 text-xs">{item.passage}</p>}{item.mediaUrl && <p className="mt-2 text-xs text-slate-600">Media: {item.mediaAlt}</p>}<ol className="mt-2 list-inside list-[upper-alpha] text-xs">{item.options.map((option, index) => <li key={index} className={option === item.correctAnswer ? "font-bold text-emerald-700" : ""}>{option}</li>)}</ol>{item.explanation && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">Explanation: {item.explanation}</p>}{!paper.isPublished && <button onClick={() => startEdit(item)} className="mt-3 text-xs font-bold text-[#15513e] underline">Correct this question</button>}</>}</article>)}</div>
        {!!paper.questions?.length && <div className="mt-5 flex items-center justify-between text-sm"><button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page + 1} of {Math.ceil(paper.questions.length / 20)}</span><button disabled={(page + 1) * 20 >= paper.questions.length} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></div>}</> : <div className="grid min-h-72 place-items-center text-center"><div><FileCheck2 className="mx-auto size-10 text-[#15513e]" /><h2 className="mt-3 font-bold">Select a paper to review</h2><p className="text-sm text-slate-600">Or validate and import a year CSV to create a new draft.</p></div></div>}</section>
    </div>
  </main>;
}
