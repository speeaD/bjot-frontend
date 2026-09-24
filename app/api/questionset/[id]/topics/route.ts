import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL;

async function proxy(request: NextRequest, params: Promise<{ id: string }>, method: 'GET' | 'POST') {
  try {
    const { id } = await params;
    const token = (await cookies()).get('auth-token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const response = await fetch(`${BACKEND_URL}/questionset/${id}/topics`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      ...(method === 'POST' && { body: JSON.stringify(await request.json()) }),
      cache: 'no-store',
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error('Error proxying question-set topics:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return proxy(request, params, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return proxy(request, params, 'POST');
}
