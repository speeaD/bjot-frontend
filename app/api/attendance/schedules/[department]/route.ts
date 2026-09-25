import { requestSchedules } from '../../../../lib/api/schedules-server';

export async function GET(_request: Request, { params }: { params: Promise<{ department: string }> }) {
  const { department } = await params;
  return requestSchedules(`/${encodeURIComponent(department)}`);
}
