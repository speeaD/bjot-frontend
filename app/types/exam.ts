/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Type definitions for the Exam/Quiz system
 * 
 * Use these types across your application for type safety
 */

// ============================================================================
// Question Types
// ============================================================================

export type QuestionType = 
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer'
  | 'essay'
  | 'fill-in-blank'
  | 'matching';

export interface BaseQuestion {
  _id?: string;
  type: QuestionType;
  question: string;
  points: number;
  order: number;
  originalQuestionId?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
  correctAnswer: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: 'true' | 'false';
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  correctAnswer: string;
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  correctAnswer?: string; // Optional rubric or sample answer
}

export type Question = 
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | EssayQuestion;

// ============================================================================
// Batch Types
// ============================================================================

export interface Batch {
  _id: string;
  batchNumber: number;
  name: string;
  description?: string;
  questions: Question[];
  totalPoints: number;
  questionsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchConfiguration {
  questionSetId: string;
  batchNumber: number;
}

// ============================================================================
// Question Set Types
// ============================================================================

export interface QuestionSet {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questions: Question[];
  totalPoints: number;
  questionsCount: number;
  usesBatches: boolean;
  batches?: Batch[];
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestionSet {
  questionSetId: string;
  batchNumber?: number;
  batchId?: string;
  batchName?: string;
  title: string;
  questions: Question[];
  totalPoints: number;
  order: number;
}

// ============================================================================
// Exam/Quiz Settings Types
// ============================================================================

export interface ExamDuration {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface ExamSettings {
  coverImage: string;
  title: string;
  isQuizChallenge: boolean;
  isOpenQuiz: boolean;
  description: string;
  instructions: string;
  duration: ExamDuration;
  multipleAttempts: boolean;
  looseFocus: boolean; // Allow users to lose focus
  viewAnswer: boolean; // Allow viewing correct answers after submission
  viewResults: boolean; // Allow viewing results after submission
  displayCalculator: boolean; // Show calculator during exam
}

// ============================================================================
// Exam/Quiz Types
// ============================================================================

export interface Exam {
  _id: string;
  settings: ExamSettings;
  questionSets: QuizQuestionSet[];
  questionSetCombination: string[]; // Array of 4 question set IDs
  batchConfiguration?: BatchConfiguration[];
  createdBy: string | User;
  isActive: boolean;
  totalPoints: number;
  totalQuestions?: number; // Computed field
  createdAt: string;
  updatedAt: string;
  participants: number;
}

// Alias for backward compatibility
export type Quiz = Exam;

// ============================================================================
// User Types
// ============================================================================

export interface User {
  _id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: 'student' | 'admin' | 'teacher';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Submission Types
// ============================================================================

export interface Answer {
  questionId: string;
  answer: string | string[]; // Can be single or multiple answers
  isCorrect?: boolean;
  pointsAwarded?: number;
}

export interface QuestionSetSubmission {
  questionSetId: string;
  answers: Answer[];
  score: number;
  maxScore: number;
  completedAt?: string;
}

export interface ExamSubmission {
  _id: string;
  examId: string | Exam;
  userId: string | User;
  questionSetSubmissions: QuestionSetSubmission[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number; // In seconds
  status: 'in-progress' | 'submitted' | 'graded';
  isLate?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface QuestionSetStatistics {
  title: string;
  questionCount: number;
  totalPoints: number;
  order: number;
  batchNumber?: number;
  batchName?: string;
  usesBatch: boolean;
}

export interface ExamStatistics {
  totalQuestionSets: number;
  totalQuestions: number;
  totalPoints: number;
  questionSetBreakdown: QuestionSetStatistics[];
  duration: number; // Total duration in seconds
  batchConfiguration?: BatchConfiguration[];
  averageScore?: number;
  participantCount?: number;
  completionRate?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface ExamListResponse extends ApiResponse {
  quizzes: Exam[];
  count?: number;
  page?: number;
  totalPages?: number;
}

export interface ExamDetailResponse extends ApiResponse {
  quiz: Exam;
}

export interface QuestionSetListResponse extends ApiResponse {
  questionSets: QuestionSet[];
  count?: number;
}

export interface StatisticsResponse extends ApiResponse {
  statistics: ExamStatistics;
}

// ============================================================================
// Form/Input Types
// ============================================================================

export interface CreateExamInput {
  settings: ExamSettings;
  questionSetCombination: string[];
  batchConfiguration?: BatchConfiguration[];
}

export interface UpdateExamSettingsInput {
  settings: Partial<ExamSettings>;
}

export interface UpdateQuestionSetsInput {
  questionSetIds: string[];
  batchConfiguration?: BatchConfiguration[];
}

export interface ExamFilters {
  isActive?: boolean;
  createdBy?: string;
  search?: string;
  subject?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface ExamCardProps {
  exam: Exam;
  onEdit?: (exam: Exam) => void;
  onDelete?: (examId: string) => void;
  onToggleActive?: (examId: string) => void;
  onPlay?: (examId: string) => void;
}

export interface QuestionSetCardProps {
  questionSet: QuizQuestionSet;
  index: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export interface StatsBadgeProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ExamValidationResult extends ValidationResult {
  warnings?: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type ExamStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type SortOrder = 'asc' | 'desc';

export type SortField = 
  | 'title'
  | 'createdAt'
  | 'updatedAt'
  | 'totalPoints'
  | 'participants';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// ============================================================================
// Context Types (for React Context)
// ============================================================================

export interface ExamContextValue {
  exam: Exam | null;
  loading: boolean;
  error: string | null;
  updateExam: (exam: Exam) => void;
  refreshExam: () => Promise<void>;
}

export interface ExamListContextValue {
  exams: Exam[];
  loading: boolean;
  error: string | null;
  filters: ExamFilters;
  setFilters: (filters: ExamFilters) => void;
  refreshExams: () => Promise<void>;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseExamReturn {
  exam: Exam | null;
  loading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<ExamSettings>) => Promise<void>;
  updateQuestionSets: (input: UpdateQuestionSetsInput) => Promise<void>;
  toggleActive: () => Promise<void>;
  deleteExam: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseExamListReturn {
  exams: Exam[];
  loading: boolean;
  error: string | null;
  filters: ExamFilters;
  setFilters: (filters: ExamFilters) => void;
  createExam: (input: CreateExamInput) => Promise<Exam>;
  refresh: () => Promise<void>;
}

// ============================================================================
// Export all types
// ============================================================================

