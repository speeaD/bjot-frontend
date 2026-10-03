// app/api/quiz-takers/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const {id} = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isActive, accountType } : { isActive?: boolean; accountType?: 'premium' } = body;
    if (isActive === undefined && accountType !== 'premium') {
      return NextResponse.json({ success: false, message: 'No valid update provided' }, { status: 400 });
    }

    // Validation
    
    // Call backend API
    const response = await fetch(`${BACKEND_URL}/admin/quiztaker/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...(isActive !== undefined && { isActive }),
        ...(accountType === 'premium' && { accountType }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to create quiz taker' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create quiz taker error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
