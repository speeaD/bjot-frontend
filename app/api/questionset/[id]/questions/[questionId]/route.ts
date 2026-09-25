import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const token = (await cookies()).get('auth-token')?.value;
  if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!process.env.BACKEND_URL) return NextResponse.json({ success: false, message: 'Question service is not configured' }, { status: 503 });
  const { id, questionId } = await params;
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/questionset/${encodeURIComponent(id)}/questions/${encodeURIComponent(questionId)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: await request.text(), cache: 'no-store',
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Could not update question:', error);
    return NextResponse.json({ success: false, message: 'Could not reach the question service' }, { status: 502 });
  }
}
