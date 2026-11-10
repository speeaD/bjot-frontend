"use client";

import { useId } from 'react';
import { expiryDate, membershipLabels, type MembershipChoice } from '../lib/admin-memberships';

export default function PlanFields({ choice, date, onChoice, onDate, proMaxExpiresAt, disabled, allowRegular = true }: {
  choice: MembershipChoice; date: string; onChoice: (value: MembershipChoice) => void; onDate: (value: string) => void;
  proMaxExpiresAt?: string | null; disabled?: boolean; allowRegular?: boolean;
}) {
  const id = useId();
  const paid = ['lite', 'pro', 'pro-max'].includes(choice);
  return <div className="space-y-4">
    <div>
      <label htmlFor={`${id}-plan`} className="mb-2 block text-sm font-medium text-gray-700">Student plan</label>
      <select id={`${id}-plan`} value={choice} disabled={disabled} onChange={(event) => {
        const next = event.target.value as MembershipChoice;
        onChoice(next);
        if (next === 'regular' || next === 'legacy') onDate('');
        if (next === 'pro-max' && proMaxExpiresAt) onDate(expiryDate(proMaxExpiresAt));
      }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
        {(Object.entries(membershipLabels) as [MembershipChoice, string][]).filter(([value]) => allowRegular || value !== 'regular').map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
    {paid && <div>
      <label htmlFor={`${id}-expiry`} className="mb-2 block text-sm font-medium text-gray-700">Access through (Lagos time)</label>
      <input id={`${id}-expiry`} type="date" required value={date} disabled={disabled} max={choice === 'pro-max' ? expiryDate(proMaxExpiresAt) || undefined : undefined}
        onChange={(event) => onDate(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      {choice === 'pro-max' && <p className="mt-1 text-xs text-gray-500">Pro Max access ends within the configured tutorial period.</p>}
    </div>}
    <p className="rounded-lg bg-[#edf4ef] p-3 text-sm text-[#234c3c]">
      {choice === 'pro' || choice === 'pro-max' ? 'JAMB past-question CBT practice is included while this plan is active.'
        : choice === 'lite' ? 'Lite includes premium classes and study support. JAMB past-question CBT practice requires Pro or Pro Max.'
          : choice === 'legacy' ? 'No paid plan is recorded. JAMB past-question CBT practice stays locked until Pro or Pro Max is assigned.' : 'Regular accounts use free features.'}
    </p>
  </div>;
}
