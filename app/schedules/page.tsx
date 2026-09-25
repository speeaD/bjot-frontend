import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requestSchedules } from '../lib/api/schedules-server';
import ScheduleManagerClient from './ScheduleManagerClient';

export default async function AdminSchedulePage() {
  if (!(await cookies()).get('auth-token')?.value) redirect('/login');
  const response = await requestSchedules();
  const payload = await response.json();
  return <ScheduleManagerClient
    initialSchedules={response.ok && Array.isArray(payload.data) ? payload.data : []}
    initialError={response.ok ? null : payload.message || 'Unable to load schedules'}
  />;
}
