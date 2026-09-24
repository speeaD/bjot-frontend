import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; topicId: string }> }) {
  try {
    const { id, topicId } = await params;
    const token = (await cookies()).get('auth-token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const response = await fetch(`${BACKEND_URL}/questionset/${id}/topics/${topicId}/questions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: await request.formData(),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error('Error uploading topic questions:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
