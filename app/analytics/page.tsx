// app/analytics/page.tsx (Server Component)
import { cookies } from "next/headers";
import AnalyticsClient from "./AnalyticsClient";

const baseUrl: string = process.env.BACKEND_URL || "http://localhost:5004/api";

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
    answer: string;
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

// Calculate analytics from submissions
function calculateAnalytics(submissions: QuizSubmission[], dateRange: string = '30d') {
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
  const quizMap = new Map();
  filteredSubmissions.forEach(submission => {
    const quizId = submission.quizId._id;
    const quizTitle = submission.quizId.settings?.title || 'Untitled Quiz';
    
    if (!quizMap.has(quizId)) {
      quizMap.set(quizId, {
        name: quizTitle,
        totalScore: 0,
        attempts: 0,
      });
    }
    
    const quiz = quizMap.get(quizId);
    quiz.totalScore += submission.percentage;
    quiz.attempts += 1;
  });
  
  const quizPerformance = Array.from(quizMap.values()).map(quiz => ({
    name: quiz.name,
    avgScore: Math.round((quiz.totalScore / quiz.attempts) * 10) / 10,
    attempts: quiz.attempts,
  }));

  // Question Analytics (most difficult)
  const questionMap = new Map();
  
  filteredSubmissions.forEach((submission) => {
    submission.answers.forEach((answer) => {
      if (!questionMap.has(answer.questionId)) {
        questionMap.set(answer.questionId, {
          questionId: answer.questionId,
          correct: 0,
          incorrect: 0,
          skipped: 0,
        });
      }
      
      const stats = questionMap.get(answer.questionId);
      if (answer.answer === '') {
        stats.skipped += 1;
      } else if (answer.isCorrect) {
        stats.correct += 1;
      } else {
        stats.incorrect += 1;
      }
    });
  });
  
  const difficultQuestions = Array.from(questionMap.values())
    .map((stats) => {
      const total = stats.correct + stats.incorrect + stats.skipped;
      return {
        id: stats.questionId,
        text: `Question ${stats.questionId.slice(-6)}`,
        correctRate: total > 0 ? Math.round((stats.correct / total) * 100) : 0,
        incorrectRate: total > 0 ? Math.round((stats.incorrect / total) * 100) : 0,
        skippedRate: total > 0 ? Math.round((stats.skipped / total) * 100) : 0,
        difficulty: total > 0 ? Math.round(((stats.incorrect + stats.skipped) / total) * 100) : 0,
      };
    })
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
  const initialAnalytics = calculateAnalytics(submissions, '30d');

  return (
    <AnalyticsClient 
      submissions={submissions}
      quizzes={quizzes}
      initialAnalytics={initialAnalytics}
    />
  );
}