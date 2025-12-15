// app/api/quiz/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const baseUrl = process.env.BACKEND_URL || "http://localhost:5004/api";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    const body = await request.json();
    const { settings, questions } = body;

    // Validation
    if (!settings || !settings.title) {
      return NextResponse.json(
        { success: false, message: "Quiz title is required" },
        { status: 400 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one question is required" },
        { status: 400 }
      );
    }

    // Forward to backend
    const response = await fetch(`${baseUrl}/quiz/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ settings, questions }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || "Failed to create quiz" 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data }, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}