import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const baseUrl = process.env.BACKEND_URL || "http://localhost:5004/api";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    const body = await request.json();
    const { quizId, quizTakerIds } = body;

    if (!quizId || !quizTakerIds || !Array.isArray(quizTakerIds)) {
      return NextResponse.json(
        { message: "Quiz ID and quiz taker IDs are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${baseUrl}/admin/assign-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ quizId, quizTakerIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || "Failed to assign quiz" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error assigning quiz:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}