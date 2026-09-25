import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('auth-token')?.value;
  if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!process.env.BACKEND_URL) return NextResponse.json({ success: false, message: 'Question service is not configured' }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const questionIds = body?.questionIds;
  const topicId = body?.topicId;
  if (!Array.isArray(questionIds) || questionIds.length < 1 || questionIds.length > 100 ||
    questionIds.some((value) => typeof value !== 'string' || !value) || new Set(questionIds).size !== questionIds.length ||
    (topicId !== null && (typeof topicId !== 'string' || !topicId))) {
    return NextResponse.json({ success: false, message: 'Choose 1 to 100 questions and a topic.' }, { status: 400 });
  }

  const updatedIds: string[] = [];
  const failedIds: string[] = [];
  let firstError = '';
  for (let offset = 0; offset < questionIds.length; offset += 4) {
    const batch = questionIds.slice(offset, offset + 4);
    await Promise.all(batch.map(async (questionId: string) => {
      try {
        const response = await fetch(`${process.env.BACKEND_URL}/questionset/${encodeURIComponent(id)}/questions/${encodeURIComponent(questionId)}`, {
          method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ topicId }), cache: 'no-store',
        });
        if (response.ok) { updatedIds.push(questionId); await response.body?.cancel(); return; }
        const error = await response.json().catch(() => ({}));
        firstError ||= error.message || `Question service returned ${response.status}`;
      } catch { firstError ||= 'Could not reach the question service'; }
      failedIds.push(questionId);
    }));
  }
  return NextResponse.json({
    success: failedIds.length === 0,
    message: failedIds.length ? `${updatedIds.length} updated; ${failedIds.length} could not be updated. ${firstError}` : `${updatedIds.length} questions updated`,
    updatedIds, failedIds,
  }, { status: failedIds.length ? 409 : 200 });
}
