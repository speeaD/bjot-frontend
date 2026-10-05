import { requestAttendance } from '../../../../lib/api/attendance-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return requestAttendance('/sessions/create', { method: 'POST', body: JSON.stringify(body) });
  } catch {
    return Response.json({ message: 'Invalid session request' }, { status: 400 });
  }
}
