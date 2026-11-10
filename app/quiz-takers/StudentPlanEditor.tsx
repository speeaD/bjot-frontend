"use client";

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { expiryDate, membershipChoice, membershipPayload, type Membership, type MembershipChoice } from '../lib/admin-memberships';
import PlanFields from './PlanFields';

export default function StudentPlanEditor({ student, proMaxExpiresAt, onSave, onClose }: {
  student: Membership & { email: string; name?: string };
  proMaxExpiresAt?: string | null;
  onSave: (payload: ReturnType<typeof membershipPayload>) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [choice, setChoice] = useState<MembershipChoice>(membershipChoice(student));
  const [date, setDate] = useState(expiryDate(student.subscriptionExpiresAt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element?.querySelector('select')?.focus();
    return () => element?.close();
  }, []);
  const dismiss = () => { dialog.current?.close(); onClose(); };
  return <dialog ref={dialog} aria-labelledby="student-plan-title" aria-modal="true" onCancel={(event) => { event.preventDefault(); if (!busy) dismiss(); }}
    className="fixed m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-[#dce5df] bg-white p-6 shadow-2xl backdrop:bg-black/50">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div><h2 id="student-plan-title" className="text-xl font-bold">Manage student plan</h2><p className="mt-1 text-sm text-slate-500">{student.name || student.email}</p></div>
      <button type="button" disabled={busy} onClick={dismiss} aria-label="Close plan editor" className="rounded p-1 text-slate-500"><X size={20} /></button>
    </div>
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      setBusy(true); setError('');
      try { await onSave(membershipPayload(choice, date, student)); dismiss(); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save plan'); }
      finally { setBusy(false); }
    }}>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <PlanFields choice={choice} date={date} onChoice={setChoice} onDate={setDate} proMaxExpiresAt={proMaxExpiresAt} disabled={busy} />
      <p className="mt-4 text-xs text-slate-500">Saving updates this student’s access immediately. Existing payment receipts remain unchanged.</p>
      <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={dismiss} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={busy} className="rounded-lg bg-[#0d513b] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save plan'}</button></div>
    </form>
  </dialog>;
}
