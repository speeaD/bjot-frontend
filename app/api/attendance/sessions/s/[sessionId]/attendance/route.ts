import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || 'https://bjot-backend.vercel.app/api';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const {sessionId }: { sessionId: string } = await params;

    const response = await fetch(`${BACKEND_URL}/attendance/admin/sessions/${sessionId}/attendance`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      cache: "no-store",
    });


    if (!response.ok) {
      throw new Error("Failed to fetch sessions for sessionId");
    }



    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}