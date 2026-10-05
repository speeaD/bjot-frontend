import { requestAttendance } from '../../../../../../lib/api/attendance-server';

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return requestAttendance(`/sessions/${encodeURIComponent(sessionId)}/attendance`);
}
