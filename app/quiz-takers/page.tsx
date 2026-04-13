// app/admin/quiz-takers/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import QuizTakersClient from './QuizTakerClient';

export default async function QuizTakersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  // No server-side fetching — page renders instantly
  // QuizTakerClient fetches all data client-side on mount
  return <QuizTakersClient />;
}