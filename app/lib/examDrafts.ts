import type { SubjectSelection } from '../componets/QuestionSetsSelector';
import type { QuizSettings } from '../types/global';

export type ExamDraft = {
  id: string;
  updatedAt: string;
  examType: 'multi-subject' | 'single-subject';
  settings: QuizSettings;
  selections: SubjectSelection[];
};

const STORAGE_KEY = 'bjot.exam-drafts.v1';
export const EXAM_DRAFTS_CHANGED = 'bjot-exam-drafts-changed';

function storageKey() {
  const adminCookie = document.cookie.split('; ').find((part) => part.startsWith('admin='));
  if (!adminCookie) return STORAGE_KEY;
  try {
    const admin = JSON.parse(decodeURIComponent(adminCookie.slice('admin='.length)));
    const id = typeof admin?.id === 'string' ? admin.id : typeof admin?._id === 'string' ? admin._id : '';
    return id ? `${STORAGE_KEY}.${id}` : STORAGE_KEY;
  } catch {
    return STORAGE_KEY;
  }
}

export function readExamDrafts(): ExamDraft[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey()) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is ExamDraft => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<ExamDraft>;
      return typeof candidate.id === 'string' &&
        typeof candidate.updatedAt === 'string' &&
        typeof candidate.settings?.title === 'string' &&
        Array.isArray(candidate.selections) &&
        candidate.selections.every((selection) => selection &&
          (selection.questionSetId === null || typeof selection.questionSetId === 'string') &&
          Array.isArray(selection.topicSelections)) &&
        (candidate.examType === 'multi-subject' || candidate.examType === 'single-subject');
    }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function saveExamDraft(draft: ExamDraft): void {
  const drafts = readExamDrafts().filter((item) => item.id !== draft.id);
  window.localStorage.setItem(storageKey(), JSON.stringify([draft, ...drafts]));
  window.dispatchEvent(new Event(EXAM_DRAFTS_CHANGED));
}

export function removeExamDraft(id: string): void {
  window.localStorage.setItem(storageKey(), JSON.stringify(readExamDrafts().filter((item) => item.id !== id)));
  window.dispatchEvent(new Event(EXAM_DRAFTS_CHANGED));
}
