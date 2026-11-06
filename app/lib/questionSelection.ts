export function questionIdsInRange(questions: readonly { id: string }[], from: string, to: string): string[] {
  const start = Number(from);
  const end = Number(to);
  if (!/^\d+$/.test(from.trim()) || !/^\d+$/.test(to.trim()) ||
    !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || end > questions.length) {
    throw new Error(`Enter whole question numbers from 1 to ${questions.length}, with From no greater than To.`);
  }
  return questions.slice(start - 1, end).map((question) => question.id);
}

export function questionFilterFor(selection: {
  topicSelections: { topicId: string; questionIds: string[] }[];
  questionIds?: string[];
}) {
  if (selection.topicSelections.length) {
    return { topicSelections: selection.topicSelections.map(({ topicId, questionIds }) => ({
      topicId, questionIds, questionCount: questionIds.length,
    })) };
  }
  return selection.questionIds === undefined ? undefined : { questionIds: selection.questionIds };
}
