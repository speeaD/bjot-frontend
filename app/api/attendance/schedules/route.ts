import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const response = await fetch(`${BACKEND_URL}/attendance/admin/schedules`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch schedules");
    }

    const data = await response.json();
    return NextResponse.json({ schedules: data.schedules || [] });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ schedules: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const scheduleData = await request.json();

    const response = await fetch(`${BACKEND_URL}/attendance/admin/schedules`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create or update schedule");
    }

    const data = await response.json();
    return NextResponse.json({ schedule: data.schedule });
  } catch (error) {
    console.error("Error creating/updating schedule:", error);
    return NextResponse.json({ message: 'Failed to create or update schedule' }, { status: 500 });
  }
}
