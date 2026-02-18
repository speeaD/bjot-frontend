import { NextResponse } from "next/server";
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
