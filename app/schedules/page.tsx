import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requestSchedules } from '../lib/api/schedules-server';
import ScheduleManagerClient from './ScheduleManagerClient';

export default async function AdminSchedulePage() {
  if (!(await cookies()).get('auth-token')?.value) redirect('/login');
  const response = await requestSchedules();
  if (response.status === 401) redirect('/login');
  const payload = await response.json();
  const validSchedules = response.ok && Array.isArray(payload.data);
  return <ScheduleManagerClient
    initialSchedules={validSchedules ? payload.data : []}
    initialError={validSchedules ? null : payload.message || 'The schedules service returned invalid data'}
  />;
}
