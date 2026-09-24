import { cookies } from 'next/headers';
import { Mail, ShieldCheck, UserRound } from 'lucide-react';

type AdminInfo = {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

export default async function Account() {
  const rawAdmin = (await cookies()).get('admin')?.value;
  let admin: AdminInfo = {};

  if (rawAdmin) {
    try {
      const parsed: unknown = JSON.parse(rawAdmin);
      if (parsed && typeof parsed === 'object') admin = parsed as AdminInfo;
    } catch {
      // The profile still renders if the optional admin cookie is unavailable.
    }
  }

  const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(' ');
  const displayName = fullName || admin.name || 'Administrator';
  const initials = displayName.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0d2818]">Administrator Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Your account information for the BJOT administration portal.</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e5ebe8] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e5ebe8] p-6 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#0d2818] text-xl font-bold text-white">
            {initials || <UserRound className="h-7 w-7" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#0d2818]">{displayName}</h3>
            <p className="text-sm text-slate-500">{admin.role || 'Administrator'}</p>
          </div>
          <span className="w-fit rounded-full bg-[#e9f5ed] px-3 py-1 text-xs font-semibold text-[#0d6449] sm:ml-auto">Active account</span>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="rounded-xl border border-[#e5ebe8] bg-[#f8faf9] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Mail className="h-4 w-4 text-[#0d6449]" /> Email address</div>
            <p className="break-all text-sm font-medium text-[#233c32]">{admin.email || 'Not available'}</p>
          </div>
          <div className="rounded-xl border border-[#e5ebe8] bg-[#f8faf9] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><ShieldCheck className="h-4 w-4 text-[#0d6449]" /> Portal role</div>
            <p className="text-sm font-medium text-[#233c32]">{admin.role || 'Administrator'}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
