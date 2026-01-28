// app/admin/quiz-takers/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import QuizTakersClient from './QuizTakerClient';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5004/api';

async function getQuizTakers(token: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/quiztakers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quiz takers');
    }

    const data = await response.json();
    return data.quizTakers || [];
  } catch (error) {
    console.error('Error fetching quiz takers:', error);
    return [];
  }
}

async function getQuizzes(token: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/quiz`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quizzes');
    }

    const data = await response.json();
    return data.quizzes || [];
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
}

async function getQuestionSets(token: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/questionset`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch question sets');
    }

    const data = await response.json();
    return data.questionSets || [];
  } catch (error) {
    console.error('Error fetching question sets:', error);
    return [];
  }
}

export default async function QuizTakersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  // Fetch all data in parallel
  const [quizTakers, quizzes, questionSets] = await Promise.all([
    getQuizTakers(token),
    getQuizzes(token),
    getQuestionSets(token),
  ]);

  return (
    <QuizTakersClient 
      initialQuizTakers={quizTakers} 
      quizzes={quizzes}
      questionSets={questionSets}
    />
  );
}