'use client';

import { MAX_CMS_IMAGE_BYTES, uploadCmsMedia } from '@/app/cms/uploadImage';
import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

type Material = { id: string; title: string; type: 'text' | 'passage' | 'image' | 'youtube'; content: string; altText: string; diagramUrl: string | null; diagramAlt: string; displayOrder: number; isPublished: boolean };
type Draft = Omit<Material, 'id' | 'diagramUrl'> & { diagramUrl: string };
const empty: Draft = { title: '', type: 'text', content: '', altText: '', diagramUrl: '', diagramAlt: '', displayOrder: 0, isPublished: false };
const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';

async function readJson(response: Response) {
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error('The Study Hub API returned an unexpected page. Deploy the backend update and try again.');
  }
  return response.json();
}

export default function StudyMaterialsDialog({ topic, onClose }: { topic: { id: string; name: string }; onClose: () => void }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadNotice, setUploadNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const response = await fetch(`/api/study-hub/admin/topics/${topic.id}/materials`, { cache: 'no-store' });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.message || 'Could not load materials');
    setMaterials(data.materials || []);
  }, [topic.id]);
  useEffect(() => { void load().catch((reason) => setError(reason.message)); }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(editingId ? `/api/study-hub/admin/materials/${editingId}` : `/api/study-hub/admin/topics/${topic.id}/materials`, {
        method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || 'Could not save material');
      setEditingId(null); setDraft({ ...empty, displayOrder: materials.length }); setUploadNotice(''); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save material'); }
    finally { setBusy(false); }
  };

  const remove = async (item: Material) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/study-hub/admin/materials/${item.id}`, { method: 'DELETE' });
      if (!response.ok) { const data = await readJson(response); throw new Error(data.message || 'Could not delete material'); }
      await load();
      if (editingId === item.id) { setEditingId(null); setDraft(empty); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete material'); }
    finally { setBusy(false); }
  };

  const uploadImage = async (file: File, target: 'content' | 'diagramUrl') => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > MAX_CMS_IMAGE_BYTES) return setError('Choose a JPG, PNG, or WebP diagram under 4 MB.');
    setBusy(true); setError(''); setUploadNotice(''); setUploadProgress(0);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90_000);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const url = await uploadCmsMedia(`cms/study-hub/images/${safeName}`, file, controller.signal, setUploadProgress);
      setDraft((current) => ({ ...current, [target]: url }));
      setUploadNotice('Diagram uploaded. Save the material to publish it.');
    } catch (reason) { setError(controller.signal.aborted ? 'Diagram upload timed out. Please retry.' : reason instanceof Error ? reason.message : 'Could not upload diagram'); }
    finally { window.clearTimeout(timeout); setBusy(false); setUploadProgress(null); }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-3 sm:p-6">
    <div role="dialog" aria-modal="true" aria-label={`Study materials for ${topic.name}`} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-bold text-[#13241c]">Study materials · {topic.name}</h2><p className="text-sm text-slate-500">Build the lesson in reading order. Publish each item when ready.</p></div><button onClick={onClose} aria-label="Close study materials"><X /></button></header>
      <div className="overflow-y-auto p-5">
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {uploadNotice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{uploadNotice}</p>}
        <div className="space-y-2">{materials.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3"><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><small className="text-slate-500">{item.type} · order {item.displayOrder} · {item.isPublished ? 'Published' : 'Draft'}{item.diagramUrl ? ' · diagram attached' : ''}</small></span><button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => { setEditingId(item.id); setUploadNotice(''); setDraft({ title: item.title, type: item.type, content: item.content, altText: item.altText, diagramUrl: item.diagramUrl ?? '', diagramAlt: item.diagramAlt ?? '', displayOrder: item.displayOrder, isPublished: item.isPublished }); }}>Edit</button><button type="button" disabled={busy} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700" onClick={() => void remove(item)}>Delete</button></article>)}</div>
        {!materials.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No materials yet. Add a text lesson, passage, image, or video.</p>}
        <form onSubmit={save} className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
          <h3 className="sm:col-span-2 font-bold">{editingId ? 'Edit material' : 'Add material'}</h3>
          <label className="text-sm font-medium">Title<input className={input} required maxLength={255} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="text-sm font-medium">Type<select className={input} value={draft.type} disabled={busy} onChange={(event) => { const type = event.target.value as Draft['type']; setUploadNotice(''); setDraft((current) => ({ ...current, type, content: '', diagramUrl: type === 'text' || type === 'passage' ? current.diagramUrl : '', diagramAlt: type === 'text' || type === 'passage' ? current.diagramAlt : '' })); }}><option value="text">Text</option><option value="passage">Passage</option><option value="image">Diagram / image</option><option value="youtube">YouTube video</option></select></label>
          {draft.type === 'text' || draft.type === 'passage' ? <label className="text-sm font-medium sm:col-span-2">Content<textarea className={`${input} min-h-36`} required maxLength={50000} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></label> : <label className="text-sm font-medium sm:col-span-2">{draft.type === 'image' ? 'Diagram URL' : 'YouTube URL'}<input className={input} required type="url" value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} />{draft.type === 'image' && <span className="mt-3 block rounded-lg border border-dashed border-[#9db9aa] bg-[#f5faf7] p-4"><span className="block font-semibold text-[#15513e]">Upload a diagram from your device</span><input aria-label="Upload diagram image" className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, 'content'); event.target.value = ''; }} /><small className="mt-1 block text-slate-500">JPG, PNG, or WebP, up to 4 MB. The URL fills in after upload.</small>{uploadProgress !== null && <span role="status" className="mt-2 block text-[#15513e]">Uploading diagram: {uploadProgress}%</span>}</span>}</label>}
          {(draft.type === 'text' || draft.type === 'passage') && <div className="space-y-3 rounded-lg border border-[#dce5df] bg-[#f8fbf9] p-4 sm:col-span-2">
            <div><h4 className="text-sm font-bold text-[#15513e]">Diagram for this material</h4><p className="mt-1 text-xs text-slate-600">Optional. It will appear immediately below the text or passage for students.</p></div>
            <label className="block text-sm font-medium">Diagram URL<input className={input} type="url" maxLength={500} value={draft.diagramUrl} onChange={(event) => setDraft((current) => ({ ...current, diagramUrl: event.target.value }))} placeholder="https://..." /></label>
            <label className="block text-sm font-medium">Or upload a diagram<input aria-label="Upload attached diagram" className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, 'diagramUrl'); event.target.value = ''; }} /><small className="mt-1 block text-slate-500">JPG, PNG, or WebP, up to 4 MB.</small></label>
            {uploadProgress !== null && <p role="status" className="text-sm text-[#15513e]">Uploading diagram: {uploadProgress}%</p>}
            {draft.diagramUrl && <><img src={draft.diagramUrl} alt={draft.diagramAlt || 'Diagram preview'} className="max-h-64 max-w-full rounded-lg border border-slate-200 object-contain" /><button type="button" className="text-xs font-semibold text-red-700 underline" onClick={() => setDraft((current) => ({ ...current, diagramUrl: '', diagramAlt: '' }))}>Remove diagram</button></>}
            <label className="block text-sm font-medium">Diagram description<input className={input} required={!!draft.diagramUrl} maxLength={500} value={draft.diagramAlt} onChange={(event) => setDraft((current) => ({ ...current, diagramAlt: event.target.value }))} /><small className="mt-1 block text-slate-500">Describe the details students need if they cannot see the diagram.</small></label>
          </div>}
          {draft.type === 'image' && draft.content && <div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Diagram preview</p><img src={draft.content} alt={draft.altText || 'Diagram preview'} className="max-h-64 max-w-full rounded-lg border border-slate-200 object-contain" /></div>}
          {draft.type === 'image' && <label className="text-sm font-medium sm:col-span-2">Diagram description<input className={input} required maxLength={500} value={draft.altText} onChange={(event) => setDraft({ ...draft, altText: event.target.value })} /><small className="mt-1 block text-slate-500">Describe the important details for students who cannot see the diagram.</small></label>}
          <label className="text-sm font-medium">Reading order<input className={input} type="number" min="0" max="100000" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} /></label>
          <label className="flex items-center gap-2 self-end text-sm font-medium"><input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} /> Published to students</label>
          <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-lg bg-[#004b37] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Save changes' : 'Add material'}</button>{editingId && <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => { setEditingId(null); setDraft(empty); }}>Cancel edit</button>}</div>
        </form>
      </div>
    </div>
  </div>;
}
