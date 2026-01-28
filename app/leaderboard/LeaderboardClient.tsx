/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { Trophy, Medal, Award, Filter, Target } from "lucide-react";
import Sidebar from "../componets/Sidebar";

interface QuestionSetSubmission {
  questionSetOrder: number;
  submittedAt: string;
  score: number;
  totalPoints: number;
  percentage: number;
  orderAnswered: number;
}

interface LeaderboardEntry {
  rank: number;
  email: string;
  accessCode: string;
  averageScore: number;
  totalQuizzes: number;
  totalPoints: number;
  // Question set specific data
  questionSetStats?: {
    averagePercentage: number;
    bestScore: number;
    totalAttempts: number;
    lastAttemptDate: string;
  };
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

interface Quiz {
  _id: string;
  settings: {
    title: string;
  };
}

interface Props {
  submissions: QuizSubmission[];
  quizzes: Quiz[];
  initialLeaderboard: LeaderboardEntry[];
}

export default function LeaderboardClient({ submissions, quizzes, initialLeaderboard }: Props) {
  const [viewMode, setViewMode] = useState<"global" | "per-quiz">("global");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("all-time");

  // Calculate leaderboard based on filters
  const leaderboard = useMemo(() => {
    // Filter by quiz if in per-quiz mode
    let filteredSubmissions = viewMode === "per-quiz" && selectedQuiz
      ? submissions.filter(s => s.quizId._id === selectedQuiz)
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
      if (selectedQuestionSet !== null && submission.questionSetSubmissions) {
        const questionSetData = submission.questionSetSubmissions.find(
          qs => qs.questionSetOrder === selectedQuestionSet
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
      if (selectedQuestionSet !== null && taker.questionSetData.attempts > 0) {
        const avgPercentage = taker.questionSetData.percentages.reduce((a: any, b: any) => a + b, 0) / 
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
    const filteredEntries = selectedQuestionSet !== null
      ? entries.filter(e => e.questionSetStats && e.questionSetStats.totalAttempts > 0)
      : entries;
    
    // Sort based on whether we're filtering by question set
    const sortedEntries = filteredEntries.sort((a, b) => {
      if (selectedQuestionSet !== null && a.questionSetStats && b.questionSetStats) {
        // Sort by best score when filtering by question set
        return b.questionSetStats.bestScore - a.questionSetStats.bestScore;
      }
      return b.averageScore - a.averageScore;
    });
    
    // Return top 50 with ranks
    return sortedEntries
      .slice(0, 50)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [submissions, viewMode, selectedQuiz, selectedQuestionSet, timeFilter]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="text-gray-600 font-semibold">{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800";
    if (rank === 2) return "bg-gray-100 text-gray-800";
    if (rank === 3) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Leaderboard
                  </h2>
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all-time">All Time</option>
                      <option value="monthly">This Month</option>
                      <option value="weekly">This Week</option>
                      <option value="daily">Today</option>
                    </select>
                  </div>
                </div>

                {/* View Mode Tabs */}
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => {
                      setViewMode("global");
                      setSelectedQuiz("");
                    }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === "global"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Global Leaderboard
                  </button>
                  <button
                    onClick={() => setViewMode("per-quiz")}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === "per-quiz"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Per Quiz
                  </button>
                </div>

                {/* Quiz Selector (only for per-quiz view) */}
                {viewMode === "per-quiz" && (
                  <div className="mb-4">
                    <select
                      value={selectedQuiz}
                      onChange={(e) => setSelectedQuiz(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a quiz...</option>
                      {quizzes.map((quiz) => (
                        <option key={quiz._id} value={quiz._id}>
                          {quiz.settings.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Question Set Filter Tabs */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Filter by Question Set:
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedQuestionSet(null)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        selectedQuestionSet === null
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All Sets
                    </button>
                    {[1, 2, 3, 4].map((setNum) => (
                      <button
                        key={setNum}
                        onClick={() => setSelectedQuestionSet(setNum)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedQuestionSet === setNum
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Set {setNum}
                      </button>
                    ))}
                  </div>
                  {selectedQuestionSet !== null && (
                    <div className="mt-2 text-xs text-gray-500">
                      Showing performance for Question Set {selectedQuestionSet} only
                    </div>
                  )}
                </div>
              </div>

              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="flex items-end justify-center gap-8 max-w-3xl mx-auto">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                          <Medal className="w-10 h-10 text-white" />
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-md text-center w-40">
                          <div className="text-2xl font-bold text-gray-800 mb-1">
                            2nd
                          </div>
                          <div className="text-sm text-gray-600 mb-2 truncate">
                            {leaderboard[1].email}
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {selectedQuestionSet !== null && leaderboard[1].questionSetStats
                              ? `${leaderboard[1].questionSetStats.bestScore} pts`
                              : `${leaderboard[1].averageScore.toFixed(1)}%`}
                          </div>
                        </div>
                        <div className="w-32 h-24 bg-gray-300 rounded-t-lg mt-2" />
                      </div>
                    )}

                    {/* 1st Place */}
                    {leaderboard[0] && (
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-2 animate-pulse">
                          <Trophy className="w-12 h-12 text-white" />
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-lg text-center w-40">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            1st
                          </div>
                          <div className="text-sm text-gray-600 mb-2 truncate">
                            {leaderboard[0].email}
                          </div>
                          <div className="text-xl font-semibold text-blue-600">
                            {selectedQuestionSet !== null && leaderboard[0].questionSetStats
                              ? `${leaderboard[0].questionSetStats.bestScore} pts`
                              : `${leaderboard[0].averageScore.toFixed(1)}%`}
                          </div>
                        </div>
                        <div className="w-32 h-32 bg-yellow-400 rounded-t-lg mt-2" />
                      </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center mb-2">
                          <Award className="w-10 h-10 text-white" />
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-md text-center w-40">
                          <div className="text-2xl font-bold text-gray-800 mb-1">
                            3rd
                          </div>
                          <div className="text-sm text-gray-600 mb-2 truncate">
                            {leaderboard[2].email}
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {selectedQuestionSet !== null && leaderboard[2].questionSetStats
                              ? `${leaderboard[2].questionSetStats.bestScore} pts`
                              : `${leaderboard[2].averageScore.toFixed(1)}%`}
                          </div>
                        </div>
                        <div className="w-32 h-20 bg-orange-400 rounded-t-lg mt-2" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full Leaderboard Table */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Top 50 Rankings
                  {selectedQuestionSet !== null && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (Question Set {selectedQuestionSet})
                    </span>
                  )}
                </h3>
                {leaderboard.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quiz Taker
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Access Code
                          </th>
                          {selectedQuestionSet === null ? (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Avg Score
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quizzes Taken
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Points
                              </th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Best Score
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Avg %
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attempts
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Attempt
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaderboard.map((entry) => (
                          <tr
                            key={entry.accessCode}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {getRankIcon(entry.rank)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.email}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono text-xs">
                                {entry.accessCode}
                              </code>
                            </td>
                            {selectedQuestionSet === null ? (
                              <>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getRankBadge(
                                      entry.rank
                                    )}`}
                                  >
                                    {entry.averageScore.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {entry.totalQuizzes}
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-green-600">
                                  {entry.totalPoints}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                    {entry.questionSetStats?.bestScore || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getRankBadge(
                                      entry.rank
                                    )}`}
                                  >
                                    {entry.questionSetStats?.averagePercentage.toFixed(1) || 0}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {entry.questionSetStats?.totalAttempts || 0}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {entry.questionSetStats?.lastAttemptDate
                                    ? formatDate(entry.questionSetStats.lastAttemptDate)
                                    : '-'}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {viewMode === "per-quiz" && !selectedQuiz
                        ? "Please select a quiz to view its leaderboard"
                        : selectedQuestionSet !== null
                        ? "No submissions found for the selected question set and filters"
                        : "No submissions found for the selected filters"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}