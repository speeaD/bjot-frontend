type QuestionType = 'multiple-choice' | 'essay' | 'true-false' | 'fill-blank';

interface QuizDuration {
  hours: number;
  minutes: number;
  seconds: number;
}

interface QuizSettings {
    coverImage: string;
    title: string;
    description: string;
    instructions: string;
    isQuizChallenge: boolean;
    isOpenQuiz: boolean;
    duration: Duration;
    shuffleQuestions: boolean;
    multipleAttempts: boolean;
    requireLogin: boolean;
    permitLoseFocus: boolean;
    viewAnswer: boolean;
    viewResults: boolean;
    displayCalculator: boolean;
}


interface Batch {
  _id: string;
  batchNumber: number;
  name: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
}

interface BatchSelection {
  questionSetId: string;
  batchNumber: number | null;
}
interface QuizAuthor {
  _id: string;
  email: string;
}

interface Question {
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

interface QuizCardProps {
  _id: string;
  settings: QuizSettings;
  questions: [Question];
  createdBy: QuizAuthor;
  isActive: boolean;
  totalPoints: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  participants?: number;
  onPlay?: (quizId: string) => void;
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface QuizTaker {
  _id: string;
  email: string;
  accessCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Answer {
  questionId: string;
  questionType: string;
  answer: string;
  isCorrect: boolean;
  pointsAwarded: number;
  pointsPossible: number;
}

export interface QuizSubmission {
  _id: string;
  quizId: {
    settings: {
      title: string;
    };
    _id: string;
  };
  quizTakerId: QuizTaker;
  answers: Answer[];
  startedAt: string;
  submittedAt: string;
  timeTaken: number; // in seconds
  score: number;
  totalPoints: number;
  percentage: number;
  status: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  quizTakerId: string;
  email: string;
  accessCode: string;
  averageScore: number;
  totalQuizzes: number;
  totalPoints: number;
  rank: number;
}

export interface QuizAnalytics {
  totalSubmissions: number;
  completionRate: number;
  averageScore: number;
  averageTimeTaken: number;
  activeUsers: number;
  submissionsOverTime: { date: string; count: number }[];
}

export interface QuestionAnalytics {
  questionId: string;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  difficulty: number; // 0-100, higher = more difficult
}