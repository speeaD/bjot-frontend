"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { BookOpen, ExternalLink, Loader2, Trash2, Upload } from "lucide-react";

type Subject = { id: string; title: string };
type Textbook = { id: string; title: string; description: string; subject: Subject; fileName: string; fileSize: number;
  isPublished: boolean; uploadCompletedAt: string | null };
type Result = { success?: boolean; message?: string };
const inputClass = "mt-1 w-full rounded-lg border border-[#dce5df] bg-white px-3 py-2.5 text-sm";

async function read<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/textbooks/admin/${path}`, { ...init, cache: "no-store" });
  const data: T & Result = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || "Textbook request failed");
  return data;
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function TextbooksAdminPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [books, setBooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publish, setPublish] = useState(true);
  const [filter, setFilter] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [subjectData, bookData] = await Promise.all([
      read<{ subjects: Subject[] }>("subjects"), read<{ textbooks: Textbook[] }>("books"),
    ]);
    setSubjects(subjectData.subjects);
    setBooks(bookData.textbooks);
  }, []);
  useEffect(() => {
    void refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load textbooks"))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const file = fileInput.current?.files?.[0];
    setError(""); setNotice("");
    if (!file || !/\.pdf$/i.test(file.name) || file.size < 5 || file.size > 50 * 1024 * 1024) {
      setError("Choose a PDF of at most 50 MB."); return;
    }
    setBusy(true);
    let pendingId: string | undefined;
    try {
      if (await file.slice(0, 5).text() !== "%PDF-") throw new Error("The selected file is not a valid PDF.");
      const data = await read<{ textbook: Textbook; uploadUrl: string }>("uploads", json("POST", {
        subjectId, title, description, fileName: file.name, fileSize: file.size, contentType: "application/pdf",
      }));
      pendingId = data.textbook.id;
      const uploaded = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file });
      if (!uploaded.ok) throw new Error("PDF upload failed. Please try again.");
      await read(`books/${pendingId}/complete`, json("POST", { isPublished: publish }));
      pendingId = undefined;
      setNotice(publish ? "Textbook published for eligible students offering this subject." : "Textbook uploaded as an unpublished draft.");
      setTitle(""); setDescription("");
      if (fileInput.current) fileInput.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload textbook");
      if (pendingId) {
        try { await read(`books/${pendingId}`, { method: "DELETE" }); }
        catch { setError((message) => `${message} An incomplete upload remains in the library; remove it before retrying.`); }
      }
    } finally {
      try { await refresh(); } catch { setError((message) => message || "Could not refresh textbooks. Reload this page."); }
      setBusy(false);
    }
  }

  async function update(book: Textbook, remove = false) {
    if (busy || (remove && !window.confirm(`Remove “${book.title}” and its PDF?`))) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await read(`books/${book.id}`, remove ? { method: "DELETE" } : json("PATCH", { isPublished: !book.isPublished }));
      setNotice(remove ? "Textbook removed." : book.isPublished ? "Textbook unpublished." : "Textbook published.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update textbook"); }
    finally { setBusy(false); }
  }

  const shown = books.filter((book) => !filter || book.subject.id === filter);
  return <main className="mx-auto max-w-6xl px-4 py-8 text-[#17231e] sm:px-8">
    <header className="rounded-2xl bg-[#0d3b2e] p-6 text-white sm:p-8">
      <BookOpen className="mb-3" aria-hidden="true" />
      <h1 className="text-3xl font-bold">Textbooks</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#d8e6de]">Upload subject textbooks for students with an active Pro or Pro Max plan. Students can access textbooks only for their assigned subjects.</p>
    </header>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    <form onSubmit={upload} className="mt-6 rounded-xl border border-[#dce5df] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold">Upload a textbook</h2>
      <fieldset disabled={busy || loading} className="mt-4 grid gap-4 disabled:opacity-70 sm:grid-cols-2">
        <label className="text-sm font-semibold">Subject<select required value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={inputClass}>
          <option value="">Choose a subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}
        </select></label>
        <label className="text-sm font-semibold">Title<input required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="e.g. Essential Physics" /></label>
        <label className="text-sm font-semibold sm:col-span-2">Description <span className="font-normal text-slate-500">(optional)</span><textarea maxLength={2000} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} /></label>
        <label className="text-sm font-semibold sm:col-span-2">PDF file<input ref={fileInput} required type="file" accept="application/pdf,.pdf" aria-describedby="textbook-file-help" className={inputClass} /><span id="textbook-file-help" className="mt-1 block text-xs font-normal text-slate-500">PDF only, up to 50 MB.</span></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} />Publish after upload</label>
        <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-[#0d3b2e] px-5 py-3 text-sm font-bold text-white disabled:cursor-wait sm:w-fit" disabled={!subjects.length}>
          {busy ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}{busy ? "Uploading PDF…" : "Upload textbook"}
        </button>
      </fieldset>
    </form>
    <section className="mt-8" aria-labelledby="textbook-library-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="textbook-library-title" className="text-xl font-bold">Textbook library</h2>
        <label className="text-sm">Filter by subject<select value={filter} onChange={(event) => setFilter(event.target.value)} className={`${inputClass} sm:ml-2 sm:w-auto`}>
          <option value="">All subjects</option>{Array.from(new Map(books.map((book) => [book.subject.id, book.subject])).values()).map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}
        </select></label>
      </div>
      {loading ? <p role="status" className="mt-5 text-sm text-slate-500">Loading textbooks…</p> : shown.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-[#dce5df] bg-white p-8 text-center text-sm text-slate-500">No textbooks yet{filter ? " for this subject" : ""}. Upload a PDF to get started.</p> :
        <div className="mt-4 grid gap-4 md:grid-cols-2">{shown.map((book) => <article key={book.id} className="rounded-xl border border-[#dce5df] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#15513e]">{book.subject.title}</p>
          <h3 className="mt-2 break-words text-lg font-bold">{book.title}</h3>
          {book.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{book.description}</p>}
          <p className="mt-3 break-words text-xs text-slate-500">{book.fileName} · {(book.fileSize / 1024 / 1024).toFixed(1)} MB</p>
          <p className="mt-2 text-xs font-bold text-[#15513e]">{!book.uploadCompletedAt ? "Incomplete upload" : book.isPublished ? "Published" : "Draft"}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {book.uploadCompletedAt && <><a href={`/api/textbooks/admin/books/${book.id}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#15513e]">Open PDF <ExternalLink size={14} /></a>
              <button disabled={busy} onClick={() => void update(book)} className="rounded-lg border border-[#dce5df] px-3 py-2 font-semibold disabled:opacity-50">{book.isPublished ? "Unpublish" : "Publish"}</button></>}
            <button disabled={busy} onClick={() => void update(book, true)} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 font-semibold text-red-700 disabled:opacity-50" aria-label={`Remove ${book.title}`}><Trash2 size={15} />Remove</button>
          </div>
        </article>)}</div>}
    </section>
  </main>;
}
