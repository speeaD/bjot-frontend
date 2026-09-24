import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown): RecordValue =>
  value && typeof value === 'object' ? value as RecordValue : {};

// The live API is being migrated from Mongo-shaped documents to Prisma rows.
// Keep this boundary compatible with the existing client while accepting either
// shape, including Prisma's join records for subjects and assignments.
function normalizeQuizTaker(value: unknown) {
  const taker = asRecord(value);
  const questionSets = Array.isArray(taker.questionSets) ? taker.questionSets : [];
  const assignedQuizzes = Array.isArray(taker.assignedQuizzes) ? taker.assignedQuizzes : [];

  return {
    ...taker,
    _id: taker.id ?? taker._id,
    questionSetCombination: Array.isArray(taker.questionSetCombination)
      ? taker.questionSetCombination
      : questionSets.map((item) => {
          const link = asRecord(item);
          const questionSet = asRecord(link.questionSet);
          return { _id: questionSet.id ?? questionSet._id ?? link.questionSetId, title: questionSet.title ?? '' };
        }),
    assignedQuizzes: assignedQuizzes.map((item) => {
      const assignment = asRecord(item);
      const quiz = asRecord(assignment.quiz ?? assignment.quizId);
      const id = quiz.id ?? quiz._id ?? assignment.quizId ?? assignment.id ?? assignment._id;
      const settings = asRecord(quiz.settings);
      const legacyQuiz = { ...quiz, _id: id, settings: { ...settings, title: settings.title ?? quiz.title ?? '' } };
      return { ...assignment, ...legacyQuiz, quizId: legacyQuiz };
    }),
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  try {
    const response = await fetch(`${BACKEND_URL}/admin/quiztakers?limit=1000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch quiz takers', quizTakers: [] },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      quizTakers: (data.quizTakers || []).map(normalizeQuizTaker),
      total: data.total,
      page: data.page,
      pages: data.pages,
    });
  } catch (error) {
    console.error("Error fetching quiz takers:", error);
    return NextResponse.json({ success: false, message: 'Unable to fetch quiz takers', quizTakers: [] }, { status: 500 });
  }
}
