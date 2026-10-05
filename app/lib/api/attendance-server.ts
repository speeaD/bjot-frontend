import { cookies } from 'next/headers';

export async function requestAttendance(path: string, options?: RequestInit) {
  const token = (await cookies()).get('auth-token')?.value;
  if (!token) return Response.json({ message: 'Please sign in again' }, { status: 401 });
  const backend = process.env.BACKEND_URL;
  if (!backend) return Response.json({ message: 'Backend is not configured' }, { status: 503 });

  try {
    const response = await fetch(`${backend}/attendance/admin${path}`, {
      ...options,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => null);
    if (!data || (response.ok && !Object.hasOwn(data, 'data'))) {
      return Response.json({
        message: response.status === 404
          ? 'Attendance is not available on the backend yet. Deploy the attendance update.'
          : 'The attendance service returned an invalid response',
      }, { status: 502 });
    }
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ message: 'Unable to reach the attendance service. Please try again.' }, { status: 502 });
  }
}
