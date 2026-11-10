export type MembershipChoice = 'regular' | 'legacy' | 'lite' | 'pro' | 'pro-max';
export type PlanFilter = 'all' | MembershipChoice | 'expired';
export type Membership = {
  accountType: 'premium' | 'regular';
  isActive: boolean;
  subscriptionLevel?: string | null;
  subscriptionPlanId?: string | null;
  subscriptionExpiresAt?: string | null;
};

export const membershipLabels: Record<MembershipChoice, string> = {
  regular: 'Regular', legacy: 'Premium — plan not set', lite: 'Lite', pro: 'Pro', 'pro-max': 'Pro Max',
};
export function membershipChoice(student: Membership): MembershipChoice {
  if (student.accountType !== 'premium') return 'regular';
  return ['lite', 'pro', 'pro-max'].includes(student.subscriptionLevel || '') ? student.subscriptionLevel as MembershipChoice : 'legacy';
}
export function membershipExpired(student: Membership, now = Date.now()): boolean {
  return student.accountType === 'premium' && !!student.subscriptionExpiresAt && !(new Date(student.subscriptionExpiresAt).getTime() > now);
}
export function jambPracticeAccess(student: Membership, now = Date.now()): boolean {
  return student.isActive && student.accountType === 'premium' && ['pro', 'pro-max'].includes(student.subscriptionLevel || '') && !membershipExpired(student, now);
}
export function matchesPlanFilter(student: Membership, filter: PlanFilter): boolean {
  return filter === 'all' || (filter === 'expired' ? membershipExpired(student) : membershipChoice(student) === filter);
}
export function expiryDate(value?: string | null): string {
  if (!value || !Number.isFinite(new Date(value).getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(new Date(value).getTime() - 1));
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function expiryLabel(value?: string | null): string {
  const date = expiryDate(value);
  return date ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', year: 'numeric', month: 'short', day: 'numeric' })
    .format(new Date(`${date}T12:00:00+01:00`)) : 'No expiry recorded';
}
export function membershipPayload(choice: MembershipChoice, date: string, current?: Membership) {
  if (choice === 'regular') return { accountType: 'regular' };
  if (choice === 'legacy') return { accountType: 'premium', subscriptionLevel: null, subscriptionExpiresAt: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose an expiry date for the selected plan');
  const original = current?.subscriptionExpiresAt;
  // Preserve the exact paid expiry if an admin changes only the tier or resaves it.
  const expiresAt = original && expiryDate(original) === date ? original
    : new Date(new Date(`${date}T00:00:00+01:00`).getTime() + 86400_000).toISOString();
  return { accountType: 'premium', subscriptionLevel: choice, subscriptionExpiresAt: expiresAt };
}
