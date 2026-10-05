import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requestAttendance } from '../../lib/api/attendance-server';
import StudentAnalyticsClient from './StudentAnalyticsClient';

export default async function StudentAnalyticsPage({ searchParams }: {
  searchParams: Promise<{ department?: string; startDate?: string; endDate?: string }>;
}) {
  if (!(await cookies()).get('auth-token')?.value) redirect('/login');
  const { department, startDate, endDate } = await searchParams;
  let initialData = null;
  let error = null;

  if (department) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString();
    const response = await requestAttendance(`/analytics/department/${encodeURIComponent(department)}${query ? `?${query}` : ''}`);
    if (response.status === 401) redirect('/login');
    const payload = await response.json();
    if (response.ok) initialData = payload.data;
    else error = payload.message || 'Unable to load attendance analytics';
  }

  return <StudentAnalyticsClient
    initialData={initialData}
    initialDepartment={department}
    initialStartDate={startDate}
    initialEndDate={endDate}
    initialError={error}
  />;
}
