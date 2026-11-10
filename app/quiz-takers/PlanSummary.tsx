import { expiryLabel, jambPracticeAccess, membershipChoice, membershipExpired, membershipLabels, type Membership } from '../lib/admin-memberships';

export default function PlanSummary({ student, onManage }: { student: Membership & { email: string; name?: string }; onManage: () => void }) {
  const choice = membershipChoice(student);
  return <div className="min-w-[180px] space-y-1.5 text-xs">
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${choice === 'pro-max' ? 'bg-purple-100 text-purple-800' : choice === 'pro' ? 'bg-green-100 text-green-800' : choice === 'legacy' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
      {membershipLabels[choice]}
    </span>
    {student.accountType === 'premium' && <>
      <p className="text-[11px] text-slate-500">{membershipExpired(student) ? 'Expired' : 'Access through'}: {expiryLabel(student.subscriptionExpiresAt)}</p>
      {student.subscriptionPlanId && <p className="max-w-[220px] break-words text-[10px] capitalize text-slate-500">{student.subscriptionPlanId.replaceAll('-', ' ')}</p>}
    </>}
    <p className={`text-[11px] font-semibold ${jambPracticeAccess(student) ? 'text-green-700' : 'text-slate-500'}`}>JAMB CBT: {jambPracticeAccess(student) ? 'Enabled' : !student.isActive ? 'Account inactive' : membershipExpired(student) ? 'Plan expired' : 'Locked'}</p>
    <button type="button" onClick={onManage} aria-label={`Manage plan for ${student.name || student.email}`} className="rounded-md bg-[#edf4ef] px-2.5 py-1.5 text-[11px] font-bold text-[#0d513b] hover:bg-[#dcebe1]">Manage plan</button>
  </div>;
}
