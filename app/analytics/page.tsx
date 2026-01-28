// app/analytics/page.tsx (Server Component)
import { cookies } from "next/headers";
import AnalyticsClient from "./AnalyticsClient";

const baseUrl: string = process.env.BACKEND_URL || "http://localhost:5004/api";

interface Question {
  _id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | boolean | string[];
  points: number;
}

interface QuestionSet {
  order: number;
  questions: Question[];
}

interface Quiz {
  _id: string;
  settings: {
    title: string;
  };
  questionSets?: QuestionSet[];
  questions?: Question[]; // Legacy support for flat question arrays
}

interface QuizSubmission {
  _id: string;
  quizId: {
    settings: {
      title: string;
    };
    _id: string;
  };
  quizTakerId: {
    _id: string;
    email: string;
    accessCode: string;
  };
  answers: Array<{
    questionId: string;
    questionType: string;
    answer: string | string[] | boolean;
    isCorrect: boolean;
    pointsAwarded: number;
    pointsPossible: number;
  }>;
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  status: string;
  submittedAt: string;
  startedAt: string;
}

async function getSubmissions() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    const response = await fetch(`${baseUrl}/admin/submissions`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error('Failed to fetch submissions');
      return [];
    }
    
    const data = await response.json();
    return data.submissions || [];
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }
}

async function getQuizzes() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    const response = await fetch(`${baseUrl}/quiz/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error('Failed to fetch quizzes');
      return [];
    }
    
    const data = await response.json();
    return data.quizzes || [];
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
}

// Helper function to build question map from quizzes
function buildQuestionMap(quizzes: Quiz[]) {
  const questionMap = new Map();
  
  quizzes.forEach(quiz => {
    // Handle questionSets structure
    if (quiz.questionSets && Array.isArray(quiz.questionSets)) {
      quiz.questionSets.forEach(questionSet => {
        if (questionSet.questions && Array.isArray(questionSet.questions)) {
          questionSet.questions.forEach(question => {
            questionMap.set(question._id, {
              id: question._id,
              quizId: quiz._id,
              quizTitle: quiz.settings?.title || 'Untitled Quiz',
              questionText: question.question,
              type: question.type,
              options: question.options || [],
              correctAnswer: question.correctAnswer,
              points: question.points,
            });
          });
        }
      });
    }
    
    // Handle legacy flat questions array
    if (quiz.questions && Array.isArray(quiz.questions)) {
      quiz.questions.forEach(question => {
        questionMap.set(question._id, {
          id: question._id,
          quizId: quiz._id,
          quizTitle: quiz.settings?.title || 'Untitled Quiz',
          questionText: question.question,
          type: question.type,
          options: question.options || [],
          correctAnswer: question.correctAnswer,
          points: question.points,
        });
      });
    }
  });
  
  return questionMap;
}

// Calculate analytics from submissions
function calculateAnalytics(
  submissions: QuizSubmission[], 
  quizzes: Quiz[],
  dateRange: string = '30d'
) {
  // Build question map
  const questionMap = buildQuestionMap(quizzes);
  
  // Filter by date range
  const now = new Date();
  const filterDate = new Date();
  const days = dateRange === 'all' ? 365 : parseInt(dateRange.replace('d', ''));
  filterDate.setDate(now.getDate() - days);
  
  const filteredSubmissions = dateRange === 'all' 
    ? submissions 
    : submissions.filter(s => new Date(s.submittedAt) >= filterDate);

  // Summary Stats
  const totalSubmissions = filteredSubmissions.length;
  const completedSubmissions = filteredSubmissions.filter(
    (s) => s.status === 'auto-graded' || s.status === 'completed'
  );
  
  const completionRate = totalSubmissions > 0 
    ? (completedSubmissions.length / totalSubmissions) * 100 
    : 0;
  
  const averageScore = completedSubmissions.length > 0
    ? completedSubmissions.reduce((sum, s) => sum + s.percentage, 0) / completedSubmissions.length
    : 0;
  
  const averageTime = completedSubmissions.length > 0
    ? completedSubmissions.reduce((sum, s) => sum + s.timeTaken, 0) / completedSubmissions.length
    : 0;
  
  const activeUsers = new Set(filteredSubmissions.map((s) => s.quizTakerId._id)).size;

  // Submissions Over Time
  const submissionsOverTime = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const count = filteredSubmissions.filter(s => 
      s.submittedAt.split('T')[0] === dateKey
    ).length;
    
    submissionsOverTime.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    });
  }

  // Score Distribution
  const scoreDistribution = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 },
  ];
  
  completedSubmissions.forEach(submission => {
    const percentage = submission.percentage;
    if (percentage <= 20) scoreDistribution[0].count++;
    else if (percentage <= 40) scoreDistribution[1].count++;
    else if (percentage <= 60) scoreDistribution[2].count++;
    else if (percentage <= 80) scoreDistribution[3].count++;
    else scoreDistribution[4].count++;
  });

  // Quiz Performance
  const quizPerformanceMap = new Map();
  filteredSubmissions.forEach(submission => {
    const quizId = submission.quizId._id;
    const quizTitle = submission.quizId.settings?.title || 'Untitled Quiz';
    
    if (!quizPerformanceMap.has(quizId)) {
      quizPerformanceMap.set(quizId, {
        name: quizTitle,
        totalScore: 0,
        attempts: 0,
      });
    }
    
    const quiz = quizPerformanceMap.get(quizId);
    quiz.totalScore += submission.percentage;
    quiz.attempts += 1;
  });
  
  const quizPerformance = Array.from(quizPerformanceMap.values()).map(quiz => ({
    name: quiz.name,
    avgScore: Math.round((quiz.totalScore / quiz.attempts) * 10) / 10,
    attempts: quiz.attempts,
  }));

  // Question Analytics with detailed tracking
  const questionStatsMap = new Map();
  
  filteredSubmissions.forEach((submission) => {
    submission.answers.forEach((answer) => {
      const questionId = answer.questionId;
      
      if (!questionStatsMap.has(questionId)) {
        questionStatsMap.set(questionId, {
          questionId: questionId,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          answerCounts: new Map(), // Track how many times each answer was chosen
          totalAttempts: 0,
        });
      }
      
      const stats = questionStatsMap.get(questionId);
      stats.totalAttempts += 1;
      
      // Track if answer was skipped, correct, or incorrect
      if (answer.answer === '' || answer.answer === null || answer.answer === undefined) {
        stats.skipped += 1;
      } else {
        // Track the actual answer chosen
        const answerKey = Array.isArray(answer.answer) 
          ? answer.answer.join(',') 
          : String(answer.answer);
        
        stats.answerCounts.set(
          answerKey,
          (stats.answerCounts.get(answerKey) || 0) + 1
        );
        
        if (answer.isCorrect) {
          stats.correct += 1;
        } else {
          stats.incorrect += 1;
        }
      }
    });
  });
  
  // Build detailed question analytics
  const difficultQuestions = Array.from(questionStatsMap.entries())
    .map(([questionId, stats]) => {
      const questionData = questionMap.get(questionId);
      const total = stats.totalAttempts;
      
      // Find most picked answer
      let mostPickedAnswer = 'N/A';
      let mostPickedCount = 0;
      
      stats.answerCounts.forEach((count: number, answer: string) => {
        if (count > mostPickedCount) {
          mostPickedCount = count;
          mostPickedAnswer = answer;
        }
      });
      
      const mostPickedPercentage = total > 0 
        ? Math.round((mostPickedCount / total) * 100) 
        : 0;
      
      // Format correct answer for display
      let correctAnswerDisplay = 'N/A';
      if (questionData) {
        if (typeof questionData.correctAnswer === 'boolean') {
          correctAnswerDisplay = questionData.correctAnswer ? 'True' : 'False';
        } else if (Array.isArray(questionData.correctAnswer)) {
          correctAnswerDisplay = questionData.correctAnswer.join(', ');
        } else {
          correctAnswerDisplay = String(questionData.correctAnswer);
        }
      }
      
      return {
        id: questionId,
        quizTitle: questionData?.quizTitle || 'Unknown Quiz',
        questionText: questionData?.questionText || `Question ${questionId.slice(-6)}`,
        questionType: questionData?.type || 'unknown',
        options: questionData?.options || [],
        correctAnswer: correctAnswerDisplay,
        correctRate: total > 0 ? Math.round((stats.correct / total) * 100) : 0,
        incorrectRate: total > 0 ? Math.round((stats.incorrect / total) * 100) : 0,
        skippedRate: total > 0 ? Math.round((stats.skipped / total) * 100) : 0,
        difficulty: total > 0 ? Math.round(((stats.incorrect + stats.skipped) / total) * 100) : 0,
        totalAttempts: total,
        mostPickedAnswer: mostPickedAnswer,
        mostPickedPercentage: mostPickedPercentage,
      };
    })
    .filter(q => q.totalAttempts > 0) // Only include questions that were actually attempted
    .sort((a, b) => b.difficulty - a.difficulty)
    .slice(0, 10);

  return {
    summaryStats: {
      totalSubmissions,
      completionRate: Math.round(completionRate * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
      averageTime: Math.round(averageTime),
      activeUsers,
    },
    submissionsOverTime,
    scoreDistribution,
    quizPerformance,
    difficultQuestions,
  };
}

export default async function AnalyticsPage() {
  const [submissions, quizzes] = await Promise.all([
    getSubmissions(),
    getQuizzes(),
  ]);

  // Calculate initial analytics (30 days)
  const initialAnalytics = calculateAnalytics(submissions, quizzes, '30d');

  return (
    <AnalyticsClient 
      submissions={submissions}
      quizzes={quizzes}
      initialAnalytics={initialAnalytics}
    />
  );
}