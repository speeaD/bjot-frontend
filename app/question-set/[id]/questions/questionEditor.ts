export type StoredQuestion = {
  id: string;
  type: string;
  question: string;
  passage?: string | null;
  diagram?: string | null;
  diagramAlt?: string | null;
  options?: unknown;
  correctAnswer?: unknown;
  points: number;
  orderNum: number;
  topicId?: string | null;
  metadata?: unknown;
  isArchived?: boolean;
};

export type QuestionDraft = {
  question: string;
  passage: string;
  diagram: string;
  diagramAlt: string;
  options: string[];
  answerIndex: number;
  answerText: string;
  explanation: string;
  points: number;
  topicId: string;
};

export const optionValues = (input: unknown): string[] => {
  if (Array.isArray(input)) return input.map((value) => String(value ?? ''));
  if (typeof input === 'string') return input.split('|').map((value) => value.trim()).filter(Boolean);
  if (input && typeof input === 'object') return Object.values(input).map((value) => String(value ?? ''));
  return [];
};

export function answerIndexFor(options: string[], answer: unknown): number {
  const value = String(answer ?? '').trim();
  if (/^[A-Z]$/i.test(value)) {
    const index = value.toUpperCase().charCodeAt(0) - 65;
    if (index < options.length) return index;
  }
  const matchingIndex = options.findIndex((option) => option.trim().toLowerCase() === value.toLowerCase());
  if (matchingIndex >= 0) return matchingIndex;
  return -1;
}

export function toDraft(source: StoredQuestion): QuestionDraft {
  const options = optionValues(source.options);
  const metadata = source.metadata && typeof source.metadata === 'object' && !Array.isArray(source.metadata)
    ? source.metadata as Record<string, unknown> : {};
  return {
    question: source.question || '', passage: source.passage || '', diagram: source.diagram || '',
    diagramAlt: source.diagramAlt || '', options,
    answerIndex: answerIndexFor(options, source.correctAnswer),
    answerText: source.correctAnswer === null || source.correctAnswer === undefined ? '' : String(source.correctAnswer),
    explanation: typeof metadata.explanation === 'string' ? metadata.explanation : '',
    points: source.points || 1, topicId: source.topicId || '',
  };
}

export function buildQuestionUpdate(source: StoredQuestion, draft: QuestionDraft): { changes: Record<string, unknown>; errors: string[] } {
  const original = toDraft(source);
  const changes: Record<string, unknown> = {};
  const errors: string[] = [];
  if (!draft.question.trim()) errors.push('Question text is required.');
  if (draft.question.length > 10000) errors.push('Question text is too long.');
  if (!Number.isInteger(draft.points) || draft.points < 1 || draft.points > 1000) errors.push('Points must be a whole number from 1 to 1000.');
  if (draft.diagram.length > 500 || draft.diagramAlt.length > 500) errors.push('Diagram URL or description is too long.');
  if (draft.explanation.length > 10000) errors.push('Explanation is too long.');

  if (draft.question.trim() !== original.question.trim()) changes.question = draft.question.trim();
  if (draft.passage !== original.passage) changes.passage = draft.passage;
  if (draft.diagram !== original.diagram) changes.diagram = draft.diagram.trim() || null;
  if (draft.diagramAlt !== original.diagramAlt) changes.diagramAlt = draft.diagramAlt;
  if (draft.points !== original.points) changes.points = draft.points;
  if (draft.topicId !== original.topicId) changes.topicId = draft.topicId || null;
  if (draft.explanation !== original.explanation) {
    const metadata = source.metadata && typeof source.metadata === 'object' && !Array.isArray(source.metadata)
      ? source.metadata as Record<string, unknown> : {};
    changes.metadata = { ...metadata, explanation: draft.explanation };
  }

  if (source.type === 'multiple-choice') {
    const optionsChanged = JSON.stringify(draft.options) !== JSON.stringify(original.options);
    const answerChanged = draft.answerIndex !== original.answerIndex;
    if (optionsChanged || answerChanged) {
      if (draft.options.length < 2 || draft.options.some((value) => !value.trim() || value.length > 2000)) {
        errors.push('Add at least two nonempty options.');
      }
      if (draft.answerIndex < 0 || draft.answerIndex >= draft.options.length) {
        errors.push('Choose the correct option.');
      } else {
        changes.correctAnswer = draft.options[draft.answerIndex].trim();
      }
      if (optionsChanged) changes.options = draft.options.map((value) => value.trim());
    }
  } else if (draft.answerText !== original.answerText) {
    if (source.type === 'true-false') {
      if (!['true', 'false'].includes(draft.answerText.toLowerCase())) errors.push('Answer must be True or False.');
      else changes.correctAnswer = draft.answerText.toLowerCase() === 'true';
    } else {
      changes.correctAnswer = draft.answerText.trim();
    }
  }
  return { changes, errors };
}
