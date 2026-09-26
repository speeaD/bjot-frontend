import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: Context) {
  const path = (await context.params).path;
  const uuid = /^[0-9a-f-]{36}$/i;
  const materials = path.length === 3 && path[0] === 'topics' && uuid.test(path[1]) && path[2] === 'materials';
  const item = path.length === 2 && path[0] === 'materials' && uuid.test(path[1]);
  if (!materials && !item) return NextResponse.json({ message: 'Unknown study hub route' }, { status: 404 });
  if (!((materials && ['GET', 'POST'].includes(request.method)) || (item && ['PUT', 'DELETE'].includes(request.method))))
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  const token = (await cookies()).get('auth-token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!process.env.BACKEND_URL) return NextResponse.json({ message: 'Backend is not configured' }, { status: 503 });
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/study-hub/admin/${path.join('/')}`, {
      method: request.method,
      headers: { Authorization: `Bearer ${token}`, ...(request.method !== 'GET' && request.method !== 'DELETE' ? { 'Content-Type': 'application/json' } : {}) },
      body: request.method === 'POST' || request.method === 'PUT' ? await request.text() : undefined,
      cache: 'no-store',
    });
    const body = await response.text();
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      console.error(`Study Hub backend returned ${response.status} with ${contentType || 'no content type'}`);
      return NextResponse.json({ success: false, message: response.status === 404
        ? 'The configured backend does not have the Study Hub API yet. Deploy the backend update, then retry.'
        : 'The Study Hub backend returned an unexpected response. Check that the backend is running the latest version.' }, { status: 502 });
    }
    return new NextResponse(body, { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'Study hub service is unavailable' }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
