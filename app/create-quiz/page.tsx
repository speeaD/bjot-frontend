'use server';

// app/create-quiz/page.tsx (Server Component)
import { cookies } from "next/headers";
import CreateQuizClient from "./CreateQuizClient";

const baseUrl: string = process.env.BACKEND_URL || "http://localhost:5004/api";

// Fetch user info if needed for the quiz creator
async function getUserInfo() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    // Optional: fetch user info if needed
    const response = await fetch(`${baseUrl}/user/profile`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

export default async function CreateQuizPage() {
  const user = await getUserInfo();

  return <CreateQuizClient user={user} />;
}