type QuizReference = { id?: string; _id?: string; title?: string; settings?: { title: string } };
type StudentReference = { id?: string; _id?: string; name?: string; email?: string; accessCode?: string | null };
type SubjectScore = { questionSetOrder: number; submittedAt: string; score: number; percentage: number };

export interface AdminSubmission {
  _id: string;
  quizId: { _id: string; settings: { title: string } };
  quizTakerId: { _id: string; name?: string; email?: string; accessCode: string };
  source: 'assigned' | 'public';
  countsForGrade: boolean;
  status: string;
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  timeTaken?: number;
  answers?: { questionId: string; answer: string | string[] | boolean; isCorrect: boolean }[];
  questionSetSubmissions?: SubjectScore[];
}

type RawSubmission = Omit<Partial<AdminSubmission>, 'quizId' | 'quizTakerId' | 'percentage'> & {
  id?: string;
  quizId?: string | QuizReference;
  quiz?: QuizReference;
  quizTakerId?: string | StudentReference;
  quizTaker?: StudentReference;
  percentage?: number | string;
};

export function normalizeAdminSubmission(value: RawSubmission): AdminSubmission {
  const quiz = value.quiz || (typeof value.quizId === 'object' ? value.quizId : undefined);
  const student = value.quizTaker || (typeof value.quizTakerId === 'object' ? value.quizTakerId : undefined);
  return {
    ...value,
    _id: value._id || value.id || '',
    quizId: { _id: quiz?._id || quiz?.id || (typeof value.quizId === 'string' ? value.quizId : ''),
      settings: { title: quiz?.settings?.title || quiz?.title || 'Untitled exam' } },
    quizTakerId: { _id: student?._id || student?.id || (typeof value.quizTakerId === 'string' ? value.quizTakerId : ''),
      name: student?.name, email: student?.email, accessCode: student?.accessCode || '' },
    source: value.source || 'assigned',
    countsForGrade: value.countsForGrade !== false && value.status !== 'in-progress',
    status: value.status || '',
    score: Number(value.score) || 0,
    totalPoints: Number(value.totalPoints) || 0,
    percentage: Number(value.percentage) || 0,
    submittedAt: value.submittedAt || '',
    questionSetSubmissions: value.questionSetSubmissions?.map((set) => ({ ...set,
      score: Number(set.score) || 0, percentage: Number(set.percentage) || 0 })),
  };
}

export function normalizeAdminQuizzes(values: QuizReference[]) {
  return values.map((quiz) => ({ _id: quiz._id || quiz.id || '',
    settings: { title: quiz.settings?.title || quiz.title || 'Untitled exam' } }));
}

export function isLeaderboardSubmission(submission: AdminSubmission): boolean {
  return submission.countsForGrade && submission.status !== 'in-progress';
}

export class AdminSubmissionsError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchAllAdminSubmissions(baseUrl: string, token: string, fetcher: typeof fetch = fetch): Promise<AdminSubmission[]> {
  const submissions = new Map<string, AdminSubmission>();
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/admin/submissions?page=${page}&limit=200`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok || data.success === false || !Array.isArray(data.submissions)) {
      throw new AdminSubmissionsError(data.message || 'Unable to load submissions', response.ok ? 502 : response.status);
    }
    if (page === 1) {
      const count = Number(data.pages);
      pages = Number.isSafeInteger(count) && count > 0 ? count : 1;
    }
    for (const row of data.submissions) {
      const submission = normalizeAdminSubmission(row);
      if (submission._id) submissions.set(submission._id, submission);
    }
  }
  return [...submissions.values()];
}
