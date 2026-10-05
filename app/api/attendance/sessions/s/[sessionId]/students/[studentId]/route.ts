import { requestAttendance } from '../../../../../../../lib/api/attendance-server';

export async function POST(request: Request, { params }: {
  params: Promise<{ sessionId: string; studentId: string }>;
}) {
  const { sessionId, studentId } = await params;
  try {
    const body = await request.json();
    return requestAttendance(`/sessions/${encodeURIComponent(sessionId)}/students/${encodeURIComponent(studentId)}/mark`, {
      method: 'POST', body: JSON.stringify(body),
    });
  } catch {
    return Response.json({ message: 'Invalid attendance mark request' }, { status: 400 });
  }
}
