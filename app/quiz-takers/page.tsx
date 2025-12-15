import { cookies } from "next/headers";
import QuizTakersClient from "./QuizTakerClient";

const baseUrl: string = process.env.BACKEND_URL || "http://localhost:5004/api";

async function getQuizTakers() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    const response = await fetch(`${baseUrl}/admin/quiztakers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store", // Ensure fresh data
    });

    if (!response.ok) {
      console.error('Failed to fetch quiz takers');
      return [];
    }
    
    const data = await response.json();
    return data.quizTakers || [];
  } catch (error) {
    console.error('Error fetching quiz takers:', error);
    return [];
  }
}

async function getQuizzes() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    const response = await fetch(`${baseUrl}/quiz/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error('Failed to fetch quizzes');
      return [];
    }
    
    const data = await response.json();
    return data.quizzes || [];
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
}

export default async function QuizTakersPage() {
  const [quizTakers, quizzes] = await Promise.all([
    getQuizTakers(),
    getQuizzes(),
  ]);

  return <QuizTakersClient initialQuizTakers={quizTakers} quizzes={quizzes} />;
}