import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const baseUrl: string = process.env.BACKEND_URL || '';


export async function POST(request: NextRequest) {
  try {
    const token = (await cookies()).get("auth-token")?.value || "";
    // Get the form data from the request
    const formData = await request.formData();

    // Forward the request to your backend
    const response = await fetch(`${baseUrl}/quiz/create-with-upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Upload failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
