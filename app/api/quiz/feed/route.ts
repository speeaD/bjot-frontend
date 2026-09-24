import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET() {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    const response = await fetch(`${BACKEND_URL}/quiz`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch (error) {
    console.error("Error fetching exam feed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load exams" },
      { status: 500 },
    );
  }
}
