import DailyDashboardClient from '../componets/DailyDashboardClient';
import { getTodayDateForApi } from '../lib/utils/attendance-utils';
import { requestAttendance } from '../lib/api/attendance-server';
import type { AttendanceSession, Department } from '../types/global';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage({ searchParams }: {
  searchParams: Promise<{ date?: string }>;
}) {
  if (!(await cookies()).get('auth-token')?.value) redirect('/login');

  const requestedDate = (await searchParams).date;
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ? requestedDate : getTodayDateForApi();
  const response = await requestAttendance(`/sessions?date=${encodeURIComponent(selectedDate)}`);
  if (response.status === 401) redirect('/login');
  const payload = await response.json();

  return <DailyDashboardClient
    initialSessions={response.ok ? payload.data as Record<Department, AttendanceSession[]> : null}
    initialDate={selectedDate}
    initialError={response.ok ? null : payload.message || 'Unable to load attendance sessions'}
  />;
}
