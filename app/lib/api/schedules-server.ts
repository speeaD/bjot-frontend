import { cookies } from 'next/headers';

export async function requestSchedules(path = '', options?: RequestInit) {
  const token = (await cookies()).get('auth-token')?.value;
  if (!token) return Response.json({ message: 'Please sign in again' }, { status: 401 });
  const backend = process.env.BACKEND_URL;
  if (!backend) return Response.json({ message: 'Backend is not configured' }, { status: 503 });
  try {
    const response = await fetch(`${backend}/attendance/admin/schedules${path}`, {
      ...options, cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({
      message: response.status === 404 ? 'Schedules are not available on the backend yet. Deploy the schedules update.' : 'The schedules service returned an invalid response',
    }));
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ message: 'Unable to reach the schedules service. Please try again.' }, { status: 502 });
  }
}
