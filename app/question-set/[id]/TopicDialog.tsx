'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { MAX_CMS_IMAGE_BYTES, uploadCmsMedia } from '@/app/cms/uploadImage';

export type TopicDetails = { id: string; name: string; isActive: boolean; coverImageUrl?: string | null };

export default function TopicDialog({ subjectId, topic, onClose, onSaved }: {
  subjectId: string;
  topic?: TopicDetails;
  onClose: () => void;
  onSaved: (topic: TopicDetails) => void;
}) {
  const [name, setName] = useState(topic?.name ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(topic?.coverImageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const uploadController = useRef<AbortController | null>(null);
  useEffect(() => () => uploadController.current?.abort(), []);

  let previewUrl: string | null = null;
  try {
    const url = new URL(coverImageUrl.trim());
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) previewUrl = url.href;
  } catch { /* An incomplete URL has no preview. */ }

  const uploadCover = async (file: File) => {
    setError(''); setNotice('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > MAX_CMS_IMAGE_BYTES) {
      setError('Choose a JPG, PNG, or WebP cover image up to 4 MB.');
      return;
    }
    setUploading(true);
    const controller = new AbortController();
    uploadController.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 90_000);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/\.{2,}/g, '-') || 'cover-image';
      const url = await uploadCmsMedia(`cms/study-hub/images/${safeName}`, file, controller.signal);
      setCoverImageUrl(url);
      setNotice('Cover uploaded. Save the topic to show it to students.');
    } catch (reason) {
      setError(controller.signal.aborted ? 'Cover upload timed out. Please retry.' : reason instanceof Error ? reason.message : 'Could not upload cover image');
    } finally {
      window.clearTimeout(timeout);
      uploadController.current = null;
      setUploading(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || uploading || !name.trim()) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/questionset/${subjectId}/topics${topic ? `/${topic.id}` : ''}`, {
        method: topic ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), coverImageUrl: coverImageUrl.trim() || null }),
      });
      const data = await response.json() as { topic?: TopicDetails; message?: string };
      if (!response.ok || !data.topic) throw new Error(data.message || 'Could not save topic');
      onSaved(data.topic);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save topic'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
    <form onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="topic-editor-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
      <h2 id="topic-editor-title" className="text-xl font-bold text-[#13241c]">{topic ? 'Edit topic' : 'Add topic'}</h2>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <fieldset disabled={saving || uploading} className="mt-5 space-y-4 disabled:opacity-70">
        <label className="block text-sm font-medium text-slate-700">Topic name
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Algebra" maxLength={255} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" required />
        </label>
        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <div><h3 className="text-sm font-semibold text-[#13241c]">Cover image <span className="font-normal text-slate-500">(optional)</span></h3><p className="mt-1 text-xs text-slate-500">Shown on the topic card and lesson page in Study Hub.</p></div>
          <label className="block text-sm font-medium text-slate-700">Cover image URL
            <input type="url" value={coverImageUrl} onChange={(event) => { setCoverImageUrl(event.target.value); setNotice(''); }} placeholder="https://..." maxLength={500} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Or upload a cover image
            <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void uploadCover(file); }} />
            <small className="mt-1 block text-slate-500">JPG, PNG, or WebP, up to 4 MB. A landscape image works best.</small>
          </label>
          {previewUrl && <Image unoptimized src={previewUrl} alt="Topic cover preview" width={800} height={450} className="aspect-video h-auto w-full rounded-lg object-cover" />}
          {coverImageUrl && <button type="button" onClick={() => { setCoverImageUrl(''); setNotice(''); }} className="text-xs font-semibold text-red-700 underline">Remove cover image</button>}
        </div>
      </fieldset>
      {uploading && <p role="status" className="mt-3 text-sm text-[#15513e]">Uploading cover image…</p>}
      <div className="mt-6 flex gap-2">
        <button type="button" disabled={saving} onClick={onClose} className="flex-1 rounded-lg bg-slate-100 py-2.5 font-semibold disabled:opacity-50">Cancel</button>
        <button disabled={saving || uploading || !name.trim()} className="flex-1 rounded-lg bg-[#004b37] py-2.5 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : topic ? 'Save changes' : 'Add topic'}</button>
      </div>
    </form>
  </div>;
}
