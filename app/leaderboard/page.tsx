import { cookies } from "next/headers";
import LeaderboardClient from "./LeaderboardClient";

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
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  submittedAt: string;
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
function calculateLeaderboard(submissions: QuizSubmission[], quizId?: string, timeFilter: string = 'all-time') {
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
      });
    }
    
    const taker = takerMap.get(takerId);
    taker.totalScore += submission.percentage;
    taker.totalQuizzes += 1;
    taker.totalPoints += submission.score;
  });
  
  // Calculate average and sort
  const leaderboard = Array.from(takerMap.values())
    .map((taker) => ({
      ...taker,
      averageScore: taker.totalScore / taker.totalQuizzes,
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 50) // Top 50
    .map((taker, index) => ({
      ...taker,
      rank: index + 1,
    }));
  
  return leaderboard;
}

export default async function LeaderboardPage({
}: {
  searchParams: { quizId?: string; timeFilter?: string };
}) {
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
