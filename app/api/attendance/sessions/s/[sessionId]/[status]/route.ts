import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || 'https://bjot-backend.vercel.app/api';

export async function PATCH(
    request: NextRequest,
  { params }: { params: Promise<{ sessionId: string, status: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const {sessionId, status}: { sessionId: string, status: string } = await params;
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/attendance/admin/sessions/${sessionId}/${status}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({body}),
      credentials: 'include',
      cache: "no-store",
    });


    if (!response.ok) {
      throw new Error("Failed to fetch sessions for sessionId");
    }



    const data = await response.json();
    console.log(`Session ${sessionId} ${status} response:`, data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}