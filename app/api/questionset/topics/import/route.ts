import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { importWithLegacyRoutes, LegacyImportError } from './legacyImport';

export async function POST(request: NextRequest) {
  const token = (await cookies()).get('auth-token')?.value;
  if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!process.env.BACKEND_URL) return NextResponse.json({ success: false, message: 'Question service is not configured' }, { status: 503 });

  try {
    const body = await request.text();
    const response = await fetch(`${process.env.BACKEND_URL}/questionset/topics/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
    const responseText = await response.text();
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (response.status === 404 && !isJson) {
      const result = await importWithLegacyRoutes(process.env.BACKEND_URL, token, JSON.parse(body));
      return NextResponse.json({ success: true, message: `Added ${result.count} questions`, ...result }, { status: 201 });
    }
    if (!isJson) return NextResponse.json({ success: false, message: `Question service returned ${response.status}. Check that the backend is running and up to date.` }, { status: response.ok ? 502 : response.status });
    return NextResponse.json(JSON.parse(responseText), { status: response.status });
  } catch (error) {
    if (error instanceof LegacyImportError) {
      return NextResponse.json({ success: false, message: error.message, partial: error.partial }, { status: error.partial ? 409 : 400 });
    }
    console.error('Could not import organized questions:', error);
    return NextResponse.json({ success: false, message: 'Could not reach the question service. Check the backend URL and connection.' }, { status: 502 });
  }
}
