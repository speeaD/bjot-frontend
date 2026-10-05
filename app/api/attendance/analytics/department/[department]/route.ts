import { requestAttendance } from '../../../../../lib/api/attendance-server';

export async function GET(request: Request, { params }: { params: Promise<{ department: string }> }) {
  const { department } = await params;
  const query = new URL(request.url).searchParams.toString();
  return requestAttendance(`/analytics/department/${encodeURIComponent(department)}${query ? `?${query}` : ''}`);
}
