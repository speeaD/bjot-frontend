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

// Attendance System Types

export type Department = 'Sciences' | 'Arts' | 'Commercial';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DayName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface QuestionSet {
  _id: string;
  title: string;
  subject?: string;
}

export interface ClassSession {
  _id: string;
  dayOfWeek: DayOfWeek;
  dayName: DayName;
  questionSet: string | QuestionSet;
  questionSetTitle: string;
  startTime: string; // "19:00"
  endTime: string; // "21:00"
  isActive: boolean;
}

export interface Schedule {
  _id: string;
  department: Department;
  weeklySchedule: ClassSession[];
  overrides: ScheduleOverride[];
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleOverride {
  _id: string;
  date: string;
  classSession: ClassSession;
  reason: string;
}

export interface AttendanceWindow {
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  openedBy?: string;
  closedBy?: string;
  durationMinutes: number;
  bufferMinutes: number;
}

export interface WindowHistory {
  action: 'opened' | 'closed';
  timestamp: string;
  admin?: string;
}

export interface AttendanceSession {
  _id: string;
  department: Department;
  questionSet: string | QuestionSet;
  questionSetTitle: string;
  date: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  attendanceWindow: AttendanceWindow;
  windowHistory: WindowHistory[];
  status: SessionStatus;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  _id: string;
  session: string | AttendanceSession;
  student: string;
  studentName: string;
  studentEmail: string;
  department: Department;
  status: AttendanceStatus;
  markedBy: 'student' | 'admin';
  admin?: string;
  markedAt: string;
  isLate: boolean;
  minutesLate: number;
  notes: string;
  createdAt: string;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  department: Department;
  accountType: 'premium' | 'regular';
  isActive: boolean;
}

export interface SessionWithAttendanceStatus extends AttendanceSession {
  attendanceMarked: boolean;
  attendanceStatus: AttendanceStatus | null;
  markedAt: string | null;
  isLate: boolean;
}

export interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  percentage: string;
}

export interface SessionAttendanceData {
  session: AttendanceSession;
  presentRecords: AttendanceRecord[];
  absentStudents: Student[];
  statistics: AttendanceStatistics;
}

export interface StudentAttendanceHistory {
  records: AttendanceRecord[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
  };
  statistics: {
    totalClasses: number;
    present: number;
    attendancePercentage: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Form types
export interface CreateScheduleForm {
  department: Department;
  weeklySchedule: {
    dayOfWeek: DayOfWeek;
    dayName: DayName;
    questionSet: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[];
}

export interface OpenWindowForm {
  durationMinutes?: number;
  bufferMinutes?: number;
}