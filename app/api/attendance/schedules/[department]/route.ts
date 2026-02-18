import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ department: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const { department } = await params;
    const response = await fetch(`${BACKEND_URL}/attendance/admin/schedules/${department}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Failed to fetch schedule for department ${department}:`, response.statusText);
      throw new Error("Failed to fetch schedules");
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ schedules: [] }, { status: 500 });
  }
}