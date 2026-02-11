import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  try {
    const response = await fetch(`${BACKEND_URL}/admin/quiztakers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch quiz takers");
    }

    const data = await response.json();
    return NextResponse.json({ quizTakers: data.quizTakers || [] });
  } catch (error) {
    console.error("Error fetching quiz takers:", error);
    return NextResponse.json({ quizTakers: [] }, { status: 500 });
  }
}
