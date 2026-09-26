'use client';

import { upload } from '@vercel/blob/client';
import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

type Material = { id: string; title: string; type: 'text' | 'passage' | 'image' | 'youtube'; content: string; altText: string; displayOrder: number; isPublished: boolean };
type Draft = Omit<Material, 'id'>;
const empty: Draft = { title: '', type: 'text', content: '', altText: '', displayOrder: 0, isPublished: false };
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
      setEditingId(null); setDraft({ ...empty, displayOrder: materials.length }); await load();
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

  const uploadImage = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return setError('Choose a JPG, PNG, or WebP image under 5 MB.');
    setBusy(true); setError('');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const blob = await upload(`cms/study-hub/images/${safeName}`, file, { access: 'public', handleUploadUrl: '/api/admin/content/media', contentType: file.type });
      setDraft((current) => ({ ...current, content: blob.url }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not upload image'); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-3 sm:p-6">
    <div role="dialog" aria-modal="true" aria-label={`Study materials for ${topic.name}`} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-bold text-[#13241c]">Study materials · {topic.name}</h2><p className="text-sm text-slate-500">Build the lesson in reading order. Publish each item when ready.</p></div><button onClick={onClose} aria-label="Close study materials"><X /></button></header>
      <div className="overflow-y-auto p-5">
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="space-y-2">{materials.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3"><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><small className="text-slate-500">{item.type} · order {item.displayOrder} · {item.isPublished ? 'Published' : 'Draft'}</small></span><button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => { setEditingId(item.id); setDraft({ title: item.title, type: item.type, content: item.content, altText: item.altText, displayOrder: item.displayOrder, isPublished: item.isPublished }); }}>Edit</button><button type="button" disabled={busy} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700" onClick={() => void remove(item)}>Delete</button></article>)}</div>
        {!materials.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No materials yet. Add a text lesson, passage, image, or video.</p>}
        <form onSubmit={save} className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
          <h3 className="sm:col-span-2 font-bold">{editingId ? 'Edit material' : 'Add material'}</h3>
          <label className="text-sm font-medium">Title<input className={input} required maxLength={255} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="text-sm font-medium">Type<select className={input} value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Draft['type'], content: '' })}><option value="text">Text</option><option value="passage">Passage</option><option value="image">Image</option><option value="youtube">YouTube video</option></select></label>
          {draft.type === 'text' || draft.type === 'passage' ? <label className="text-sm font-medium sm:col-span-2">Content<textarea className={`${input} min-h-36`} required maxLength={50000} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></label> : <label className="text-sm font-medium sm:col-span-2">{draft.type === 'image' ? 'Image URL' : 'YouTube URL'}<input className={input} required type="url" value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} />{draft.type === 'image' && <span className="mt-2 block"><input aria-label="Upload image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} /><small className="block text-slate-500">Upload a JPG, PNG, or WebP image up to 5 MB.</small></span>}</label>}
          {draft.type === 'image' && <label className="text-sm font-medium sm:col-span-2">Image description<input className={input} required maxLength={500} value={draft.altText} onChange={(event) => setDraft({ ...draft, altText: event.target.value })} /></label>}
          <label className="text-sm font-medium">Reading order<input className={input} type="number" min="0" max="100000" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} /></label>
          <label className="flex items-center gap-2 self-end text-sm font-medium"><input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} /> Published to students</label>
          <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-lg bg-[#004b37] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Save changes' : 'Add material'}</button>{editingId && <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => { setEditingId(null); setDraft(empty); }}>Cancel edit</button>}</div>
        </form>
      </div>
    </div>
  </div>;
}
