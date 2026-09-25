import { requestSchedules } from '../../../lib/api/schedules-server';

export async function GET() {
  return requestSchedules();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return requestSchedules('', { method: 'POST', body: JSON.stringify(body) });
  } catch {
    return Response.json({ message: 'Invalid schedule request' }, { status: 400 });
  }
}
