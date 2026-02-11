/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import { cookies } from "next/headers";
import LeaderboardClient from "./LeaderboardClient";

const baseUrl: string = process.env.BACKEND_URL || "http://localhost:5004/api";

interface QuestionSetSubmission {
  questionSetOrder: number;
  submittedAt: string;
  score: number;
  totalPoints: number;
  percentage: number;
  orderAnswered: number;
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
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  submittedAt: string;
  questionSetSubmissions?: QuestionSetSubmission[];
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

// Calculate leaderboard from submissions
function calculateLeaderboard(
  submissions: QuizSubmission[], 
  quizId?: string, 
  timeFilter: string = 'all-time',
  questionSetOrder?: number
) {
  // Filter by quiz if specified
  let filteredSubmissions = quizId 
    ? submissions.filter(s => s.quizId._id === quizId)
    : submissions;

  // Filter by time
  const now = new Date();
  const filterDate = new Date();
  
  switch (timeFilter) {
    case 'daily':
      filterDate.setDate(now.getDate() - 1);
      filteredSubmissions = filteredSubmissions.filter(s => new Date(s.submittedAt) >= filterDate);
      break;
    case 'weekly':
      filterDate.setDate(now.getDate() - 7);
      filteredSubmissions = filteredSubmissions.filter(s => new Date(s.submittedAt) >= filterDate);
      break;
    case 'monthly':
      filterDate.setMonth(now.getMonth() - 1);
      filteredSubmissions = filteredSubmissions.filter(s => new Date(s.submittedAt) >= filterDate);
      break;
    // 'all-time' doesn't filter
  }

  // Group by quiz taker
  const takerMap = new Map();
  
  filteredSubmissions.forEach((submission) => {
    const takerId = submission.quizTakerId._id;
    const email = submission.quizTakerId.email;
    const accessCode = submission.quizTakerId.accessCode;
    
    if (!takerMap.has(takerId)) {
      takerMap.set(takerId, {
        email,
        accessCode,
        totalScore: 0,
        totalQuizzes: 0,
        totalPoints: 0,
        // Question set tracking
        questionSetData: {
          percentages: [],
          scores: [],
          attempts: 0,
          lastAttempt: null,
        },
      });
    }
    
    const taker = takerMap.get(takerId);
    
    // Overall quiz stats
    taker.totalScore += submission.percentage;
    taker.totalQuizzes += 1;
    taker.totalPoints += Math.round((submission.score / submission.totalPoints) * 400);
    
    // Question set specific stats
    if (questionSetOrder !== undefined && submission.questionSetSubmissions) {
      const questionSetData = submission.questionSetSubmissions.find(
        qs => qs.questionSetOrder === questionSetOrder
      );
      
      if (questionSetData) {
        taker.questionSetData.percentages.push(questionSetData.percentage);
        taker.questionSetData.scores.push(questionSetData.score);
        taker.questionSetData.attempts += 1;
        
        const attemptDate = new Date(questionSetData.submittedAt);
        if (!taker.questionSetData.lastAttempt || attemptDate > new Date(taker.questionSetData.lastAttempt)) {
          taker.questionSetData.lastAttempt = questionSetData.submittedAt;
        }
      }
    }
  });
  
  // Calculate averages and prepare leaderboard entries
  const entries = Array.from(takerMap.values()).map((taker) => {
    const entry: any = {
      email: taker.email,
      accessCode: taker.accessCode,
      averageScore: taker.totalScore / taker.totalQuizzes,
      totalQuizzes: taker.totalQuizzes,
      totalPoints: taker.totalPoints,
    };
    
    // Add question set stats if filtered
    if (questionSetOrder !== undefined && taker.questionSetData.attempts > 0) {
      const avgPercentage = taker.questionSetData.percentages.reduce((a: number, b: number) => a + b, 0) / 
                            taker.questionSetData.percentages.length;
      const bestScore = Math.max(...taker.questionSetData.scores);
      
      entry.questionSetStats = {
        averagePercentage: avgPercentage,
        bestScore: bestScore,
        totalAttempts: taker.questionSetData.attempts,
        lastAttemptDate: taker.questionSetData.lastAttempt,
      };
    }
    
    return entry;
  });
  
  // Filter out users with no question set data if filtering by question set
  const filteredEntries = questionSetOrder !== undefined
    ? entries.filter(e => e.questionSetStats && e.questionSetStats.totalAttempts > 0)
    : entries;
  
  // Sort based on whether we're filtering by question set
  const sortedEntries = filteredEntries.sort((a, b) => {
    if (questionSetOrder !== undefined && a.questionSetStats && b.questionSetStats) {
      // Sort by best score when filtering by question set
      return b.questionSetStats.bestScore - a.questionSetStats.bestScore;
    }
    return b.averageScore - a.averageScore;
  });
  
  // Return top 50 with ranks
  const leaderboard = sortedEntries
    .slice(0, 50)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  
  return leaderboard;
}

export default async function LeaderboardPage() {
  const [submissions, quizzes] = await Promise.all([
    getSubmissions(),
    getQuizzes(),
  ]);

  // Calculate initial leaderboard (global, all-time)
  const initialLeaderboard = calculateLeaderboard(submissions);

  return (
    <LeaderboardClient 
      submissions={submissions}
      quizzes={quizzes}
      initialLeaderboard={initialLeaderboard}
    />
  );
}