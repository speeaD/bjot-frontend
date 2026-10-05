import { requestAttendance } from '../../../../lib/api/attendance-server';

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return requestAttendance(`/sessions?date=${encodeURIComponent(date)}`);
}
