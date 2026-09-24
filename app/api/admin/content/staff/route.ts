import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth-token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const response = await fetch(`${BACKEND_URL}/admin/content/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error('Error creating CMS staff member:', error);
    return NextResponse.json({ success: false, message: 'Unable to save staff member' }, { status: 500 });
  }
}
