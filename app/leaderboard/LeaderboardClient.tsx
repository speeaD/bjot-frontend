"use client";

import { useState, useMemo } from "react";
import { Trophy, Medal, Award, Filter } from "lucide-react";
import Sidebar from "../componets/Sidebar";

interface LeaderboardEntry {
  rank: number;
  email: string;
  accessCode: string;
  averageScore: number;
  totalQuizzes: number;
  totalPoints: number;
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
        });
      }
      
      const taker = takerMap.get(takerId);
      taker.totalScore += submission.percentage;
      taker.totalQuizzes += 1;
      taker.totalPoints += submission.score;
    });
    
    // Calculate average and sort
    return Array.from(takerMap.values())
      .map((taker) => ({
        ...taker,
        averageScore: taker.totalScore / taker.totalQuizzes,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 50)
      .map((taker, index) => ({
        ...taker,
        rank: index + 1,
      }));
  }, [submissions, viewMode, selectedQuiz, timeFilter]);

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
                        ? "bg-blue-bg text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Global Leaderboard
                  </button>
                  <button
                    onClick={() => setViewMode("per-quiz")}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === "per-quiz"
                        ? "bg-blue-bg text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Per Quiz
                  </button>
                </div>

                {/* Quiz Selector (only for per-quiz view) */}
                {viewMode === "per-quiz" && (
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
                )}
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
                            {leaderboard[1].averageScore.toFixed(1)}%
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
                            {leaderboard[0].averageScore.toFixed(1)}%
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
                            {leaderboard[2].averageScore.toFixed(1)}%
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quizzes Taken
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Points
                          </th>
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