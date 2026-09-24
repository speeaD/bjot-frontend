export const dynamic = 'force-dynamic';

import AnalyticsClient from './AnalyticsClient';
import { getAllQuizzes, getSubmissions } from '../lib/data';

type RawQuiz = {
  id?: string;
  _id?: string;
  title?: string;
  settings?: { title: string };
  questionSets?: Array<{ questions?: Array<{ _id: string; question: string; type: string; options?: string[] }> }>;
};

type RawSubmission = {
  id?: string;
  _id?: string;
  quizId?: string | { _id: string; settings: { title: string } };
  quiz?: { id: string; title: string };
  quizTakerId?: string | { _id: string };
  quizTaker?: { id: string };
  answers?: Array<{ questionId: string; answer: string | string[] | boolean; isCorrect: boolean }>;
  percentage?: number | string;
  timeTaken?: number;
  status?: string;
  submittedAt?: string;
};

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ quizId?: string }> }) {
  const [rawSubmissions, rawQuizzes] = await Promise.all([getSubmissions(), getAllQuizzes()]);

  const quizzes = (rawQuizzes as RawQuiz[]).map((quiz) => ({
    _id: quiz._id || quiz.id || '',
    settings: { title: quiz.settings?.title || quiz.title || 'Untitled exam' },
    questionSets: (quiz.questionSets || []).map((set) => ({ questions: set.questions || [] })),
  }));
  const submissions = (rawSubmissions as RawSubmission[]).map((submission) => ({
    _id: submission._id || submission.id || '',
    quizId: typeof submission.quizId === 'object' ? submission.quizId : {
      _id: submission.quiz?.id || submission.quizId || '',
      settings: { title: submission.quiz?.title || 'Untitled exam' },
    },
    quizTakerId: typeof submission.quizTakerId === 'object' ? submission.quizTakerId : {
      _id: submission.quizTaker?.id || submission.quizTakerId || '',
    },
    answers: submission.answers || [],
    percentage: Number(submission.percentage) || 0,
    timeTaken: Number(submission.timeTaken) || 0,
    status: submission.status || '',
    submittedAt: submission.submittedAt || '',
  }));

  const { quizId } = await searchParams;
  const initialQuizId = quizzes.some((quiz) => quiz._id === quizId) ? quizId : undefined;

  return <AnalyticsClient key={initialQuizId || 'all'} submissions={submissions} quizzes={quizzes} initialQuizId={initialQuizId} />;
}
