import { formatDateForApi, getTodayDate } from '@/app/lib/utils/attendance-utils';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminApi } from '../../../lib/api/attendance-client';
import SessionDetailsClient from './SessionDetailsClient';

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

const BACKEND_URL = process.env.BACKEND_URL || 'https://bjot-backend.vercel.app/api';

async function fetchSessionDetails(sessionId: string, token: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/attendance/admin/sessions/${sessionId}/attendance`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch session details");
    }

    const data = await response.json();
    return { data: data.data};
  } catch (error) {
    console.error("Error fetching session details:", error);
    return { error: "Failed to fetch session details" };
  }
}

export default async function SessionDetailsPage({ params}: PageProps) {
 
const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/admin/login');
  }
 
  const { sessionId } = await params;
  const { data: initialData, error: fetchError } = await fetchSessionDetails(sessionId, token);
  const error = fetchError ? fetchError : null;

  return (
    <SessionDetailsClient 
      sessionId={sessionId}
      initialData={initialData}
      initialError={error}
    />
  );
}