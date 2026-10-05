import { requestAttendance } from '../../../../../../lib/api/attendance-server';

export async function PATCH(request: Request, { params }: {
  params: Promise<{ sessionId: string; status: string }>;
}) {
  const { sessionId, status } = await params;
  if (status !== 'open' && status !== 'close') {
    return Response.json({ message: 'Invalid attendance action' }, { status: 400 });
  }
  try {
    const body = await request.json();
    return requestAttendance(`/sessions/${encodeURIComponent(sessionId)}/${status}`, {
      method: 'PATCH', body: JSON.stringify(body),
    });
  } catch {
    return Response.json({ message: 'Invalid attendance window request' }, { status: 400 });
  }
}
