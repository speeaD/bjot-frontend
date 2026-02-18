import DailyDashboardClient from '../componets/DailyDashboardClient';
import { formatDateForApi, getTodayDate } from '../lib/utils/attendance-utils';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5004/api';

async function getSessions(token: string, date: string) {
  try {
    const response = await fetch(`${BACKEND_URL}attendance/admin/sessions?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },

      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}


export default async function AdminDashboardPage({
}) {
const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/admin/login');
  }
 
  const selectedDate = formatDateForApi(getTodayDate());
  const error = null;
  // eslint-disable-next-line react-hooks/purity
  const initialSessions = await getSessions(token, formatDateForApi(new Date(Date.now())));


  return (
    <DailyDashboardClient 
      initialSessions={initialSessions}
      initialDate={selectedDate}
      initialError={error}
    />
  );
}