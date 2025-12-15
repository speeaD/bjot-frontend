"use client";

import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    TrendingUp,
    Users,
    Clock,
    Target,
    AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Sidebar from "../componets/Sidebar";

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
}

interface Quiz {
    _id: string;
    settings: {
        title: string;
    };
}

interface AnalyticsData {
    summaryStats: {
        totalSubmissions: number;
        completionRate: number;
        averageScore: number;
        averageTime: number;
        activeUsers: number;
    };
    submissionsOverTime: Array<{ date: string; count: number }>;
    scoreDistribution: Array<{ range: string; count: number }>;
    quizPerformance: Array<{ name: string; avgScore: number; attempts: number }>;
    difficultQuestions: Array<{
        id: string;
        text: string;
        correctRate: number;
        incorrectRate: number;
        skippedRate: number;
        difficulty: number;
    }>;
}

interface Props {
    submissions: QuizSubmission[];
    quizzes: Quiz[];
    initialAnalytics: AnalyticsData;
}

export default function AnalyticsClient({ submissions, quizzes, initialAnalytics }: Props) {
    const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
    const [dateRange, setDateRange] = useState<string>("30d");

    const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    // Calculate analytics based on filters
    const analytics = useMemo(() => {
        // Filter by quiz
        let filteredSubmissions = selectedQuiz === "all"
            ? submissions
            : submissions.filter(s => s.quizId._id === selectedQuiz);

        // Filter by date range
        const now = new Date();
        const filterDate = new Date();
        const days = dateRange === 'all' ? 365 : parseInt(dateRange.replace('d', ''));
        filterDate.setDate(now.getDate() - days);

        filteredSubmissions = dateRange === 'all'
            ? filteredSubmissions
            : filteredSubmissions.filter(s => new Date(s.submittedAt) >= filterDate);

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

        // Question Analytics
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
    }, [submissions, selectedQuiz, dateRange]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-3 py-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar */}
                    <Sidebar />

                    {/* Main Content */}
                    <div className="col-span-9">
                        {/* Header */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-semibold text-gray-800">
                                    Analytics Dashboard
                                </h2>
                                <div className="flex gap-3">
                                    <select
                                        value={selectedQuiz}
                                        onChange={(e) => setSelectedQuiz(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Quizzes</option>
                                        {quizzes.map((quiz) => (
                                            <option key={quiz._id} value={quiz._id}>
                                                {quiz.settings.title}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="7d">Last 7 days</option>
                                        <option value="30d">Last 30 days</option>
                                        <option value="90d">Last 90 days</option>
                                        <option value="all">All time</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats Cards */}
                        <div className="grid grid-cols-5 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-8 h-8 text-blue-500" />
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                    {analytics.summaryStats.totalSubmissions}
                                </div>
                                <div className="text-sm text-gray-500">Total Submissions</div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <Target className="w-8 h-8 text-green-500" />
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                    {analytics.summaryStats.completionRate}%
                                </div>
                                <div className="text-sm text-gray-500">Completion Rate</div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <BarChart className="w-8 h-8 text-purple-500" />
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                    {analytics.summaryStats.averageScore}%
                                </div>
                                <div className="text-sm text-gray-500">Average Score</div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="w-8 h-8 text-orange-500" />
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                    {formatTime(analytics.summaryStats.averageTime)}
                                </div>
                                <div className="text-sm text-gray-500">Avg Time Taken</div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <Users className="w-8 h-8 text-indigo-500" />
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                    {analytics.summaryStats.activeUsers}
                                </div>
                                <div className="text-sm text-gray-500">Active Users</div>
                            </div>
                        </div>

                        {/* Submissions Over Time */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Quiz Attempts Over Time
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.submissionsOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        name="Submissions"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Score Distribution and Quiz Performance */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* Score Distribution */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Score Distribution
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.scoreDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ payload }) => `${payload.range}: ${payload.count}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {analytics.scoreDistribution.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Quiz Performance Comparison */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Quiz Performance Comparison
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics.quizPerformance}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="avgScore" fill="#10B981" name="Avg Score %" />
                                        <Bar dataKey="attempts" fill="#3B82F6" name="Attempts" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Most Difficult Questions */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Most Difficult Questions
                                </h3>
                            </div>
                            {analytics.difficultQuestions.length > 0 ? (
                                <div className="space-y-4">
                                    {analytics.difficultQuestions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="border border-gray-200 rounded-lg p-4"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                                            #{index + 1} Most Difficult
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Question ID: {question.id}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">
                                                        {question.text}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-green-50 rounded-lg p-3">
                                                    <div className="text-lg font-bold text-green-600">
                                                        {question.correctRate}%
                                                    </div>
                                                    <div className="text-xs text-gray-600">Correct</div>
                                                </div>
                                                <div className="bg-red-50 rounded-lg p-3">
                                                    <div className="text-lg font-bold text-red-600">
                                                        {question.incorrectRate}%
                                                    </div>
                                                    <div className="text-xs text-gray-600">Incorrect</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-lg font-bold text-gray-600">
                                                        {question.skippedRate}%
                                                    </div>
                                                    <div className="text-xs text-gray-600">Skipped</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No question data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}