/* eslint-disable @typescript-eslint/no-explicit-any */
// API configuration
const API_BASE_URL = process.env.BACKEND_URL || '';

// Types
export interface ExamSettings {
  coverImage: string;
  title: string;
  isQuizChallenge: boolean;
  isOpenQuiz: boolean;
  description: string;
  instructions: string;
  duration: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  multipleAttempts: boolean;
  looseFocus: boolean;
  viewAnswer: boolean;
  viewResults: boolean;
  displayCalculator: boolean;
}

export interface Question {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  order: number;
  originalQuestionId: string;
}

export interface QuestionSet {
  questionSetId: string;
  batchNumber?: number;
  batchId?: string;
  batchName?: string;
  title: string;
  questions: Question[];
  totalPoints: number;
  order: number;
}

export interface Exam {
  _id: string;
  settings: ExamSettings;
  questionSets: QuestionSet[];
  questionSetCombination: string[];
  batchConfiguration?: Array<{
    questionSetId: string;
    batchNumber: number;
  }>;
  createdBy: {
    _id: string;
    email: string;
  };
  isActive: boolean;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
  participants: number;
}

export interface CreateExamPayload {
  settings: ExamSettings;
  questionSetCombination: string[];
  batchConfiguration?: Array<{
    questionSetId: string;
    batchNumber: number;
  }>;
}

export interface UpdateExamSettingsPayload {
  settings: ExamSettings;
}

export interface UpdateQuestionSetsPayload {
  questionSetIds: string[];
  batchConfiguration?: Array<{
    questionSetId: string;
    batchNumber: number;
  }>;
}

// API Helper Functions

/**
 * Fetch all exams
 */
export async function fetchExams(filters?: {
  isActive?: boolean;
  createdBy?: string;
}): Promise<Exam[]> {
  const queryParams = new URLSearchParams();
  if (filters?.isActive !== undefined) {
    queryParams.append('isActive', String(filters.isActive));
  }
  if (filters?.createdBy) {
    queryParams.append('createdBy', filters.createdBy);
  }

  const url = `${API_BASE_URL}/api/quiz${queryParams.toString() ? `?${queryParams}` : ''}`;
  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch exams');
  }

  const data = await res.json();
  return data.quizzes || [];
}

/**
 * Fetch a single exam by ID
 */
export async function fetchExamById(id: string): Promise<Exam> {
  const res = await fetch(`${API_BASE_URL}/api/quiz/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch exam');
  }

  const data = await res.json();
  return data.quiz;
}

/**
 * Create a new exam
 */
export async function createExam(payload: CreateExamPayload): Promise<Exam> {
  const res = await fetch(`${API_BASE_URL}/api/quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create exam');
  }

  const data = await res.json();
  return data.quiz;
}

/**
 * Update exam settings
 */
export async function updateExamSettings(
  id: string,
  payload: UpdateExamSettingsPayload
): Promise<Exam> {
  const res = await fetch(`${API_BASE_URL}/api/quiz/${id}/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update exam settings');
  }

  const data = await res.json();
  return data.quiz;
}

/**
 * Update exam question sets
 */
export async function updateExamQuestionSets(
  id: string,
  payload: UpdateQuestionSetsPayload
): Promise<Exam> {
  const res = await fetch(`${API_BASE_URL}/api/quiz/${id}/question-sets`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update question sets');
  }

  const data = await res.json();
  return data.quiz;
}

/**
 * Toggle exam active status
 */
export async function toggleExamActive(id: string): Promise<Exam> {
  const res = await fetch(`${API_BASE_URL}/api/quiz/${id}/toggle-active`, {
    method: 'PATCH',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to toggle exam status');
  }

  const data = await res.json();
  return data.quiz;
}

/**
 * Delete an exam
 */
export async function deleteExam(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/quiz/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete exam');
  }
}

/**
 * Get exam statistics
 */
export async function fetchExamStatistics(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/quiz/${id}/statistics`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch exam statistics');
  }

  const data = await res.json();
  return data.statistics;
}

/**
 * Find exams by question set combination
 */
export async function fetchExamsByQuestionSetCombination(
  setIds: [string, string, string, string]
): Promise<Exam[]> {
  const [setId1, setId2, setId3, setId4] = setIds;
  const res = await fetch(
    `${API_BASE_URL}/api/quiz/by-combination/${setId1}/${setId2}/${setId3}/${setId4}`,
    {
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch exams by combination');
  }

  const data = await res.json();
  return data.quizzes || [];
}

// Utility Functions

/**
 * Calculate total duration in minutes
 */
export function calculateDuration(duration: {
  hours: number;
  minutes: number;
  seconds: number;
}): number {
  return duration.hours * 60 + duration.minutes + duration.seconds / 60;
}

/**
 * Format duration to readable string
 */
export function formatDuration(duration: {
  hours: number;
  minutes: number;
  seconds: number;
}): string {
  const parts = [];
  
  if (duration.hours > 0) {
    parts.push(`${duration.hours}h`);
  }
  if (duration.minutes > 0) {
    parts.push(`${duration.minutes}m`);
  }
  if (duration.seconds > 0) {
    parts.push(`${duration.seconds}s`);
  }
  
  return parts.join(' ') || '0s';
}

/**
 * Validate exam payload before submission
 */
export function validateExamPayload(payload: CreateExamPayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate settings
  if (!payload.settings.title || payload.settings.title.trim() === '') {
    errors.push('Exam title is required');
  }

  // Validate question sets
  if (!payload.questionSetCombination || payload.questionSetCombination.length !== 4) {
    errors.push('Exactly 4 question sets are required');
  }

  if (payload.questionSetCombination?.some(id => !id || id.trim() === '')) {
    errors.push('All question set slots must be filled');
  }

  // Check for duplicates
  const uniqueSets = new Set(payload.questionSetCombination);
  if (uniqueSets.size !== 4) {
    errors.push('Cannot use the same question set multiple times');
  }

  // Validate batch configuration if provided
  if (payload.batchConfiguration) {
    if (payload.batchConfiguration.length !== 4) {
      errors.push('Batch configuration must have exactly 4 entries');
    }

    payload.batchConfiguration.forEach((bc, index) => {
      if (!bc.questionSetId || !bc.batchNumber) {
        errors.push(`Batch configuration at index ${index} is invalid`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate total questions in exam
 */
export function calculateTotalQuestions(exam: Exam): number {
  return exam.questionSets.reduce((sum, qs) => sum + qs.questions.length, 0);
}

/**
 * Get question type distribution
 */
export function getQuestionTypeDistribution(exam: Exam): Record<string, number> {
  const distribution: Record<string, number> = {};

  exam.questionSets.forEach(qs => {
    qs.questions.forEach(q => {
      distribution[q.type] = (distribution[q.type] || 0) + 1;
    });
  });

  return distribution;
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Check if exam can be edited
 */
export function canEditExam(exam: Exam, userId: string): boolean {
  // Check if user is the creator
  if (exam.createdBy._id !== userId) {
    return false;
  }

  // Check if exam has participants
  if (exam.participants && exam.participants > 0) {
    return false;
  }

  return true;
}

/**
 * Get exam status color
 */
export function getExamStatusColor(isActive: boolean): {
  bg: string;
  text: string;
} {
  return isActive
    ? { bg: 'bg-green-100', text: 'text-green-700' }
    : { bg: 'bg-gray-100', text: 'text-gray-700' };
}