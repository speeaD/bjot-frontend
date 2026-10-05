import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requestAttendance } from '../../../lib/api/attendance-server';
import type { SessionAttendanceData } from '../../../types/global';
import SessionDetailsClient from './SessionDetailsClient';

export default async function SessionDetailsPage({ params }: {
  params: Promise<{ sessionId: string }>;
}) {
  if (!(await cookies()).get('auth-token')?.value) redirect('/login');

  const { sessionId } = await params;
  const response = await requestAttendance(`/sessions/${encodeURIComponent(sessionId)}/attendance`);
  if (response.status === 401) redirect('/login');
  const payload = await response.json();

  return <SessionDetailsClient
    sessionId={sessionId}
    initialData={response.ok ? payload.data as SessionAttendanceData : null}
    initialError={response.ok ? null : payload.message || 'Unable to load session attendance'}
  />;
}
