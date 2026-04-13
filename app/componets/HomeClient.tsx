/* eslint-disable @typescript-eslint/no-explicit-any */
// HomeClient.tsx
'use client';

import { useState, useEffect } from "react";
import { CirclePlus } from "lucide-react";
import Link from "next/link";
import QuizCard from "./QuizCard";
import Sidebar from "./Sidebar";

export default function HomeClient() {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quiz/')
      .then(r => r.json())
      .then(data => setQuizzes(data.quizzes || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          <div className="lg:col-span-9 space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 border-b border-gray-100 gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Exam Feed</h2>
                <Link
                  className="w-full sm:w-auto px-4 py-2.5 md:py-3 bg-green-bg text-white rounded-lg md:rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  href="/create-quiz"
                >
                  <CirclePlus className="w-4 h-4 md:w-5 md:h-5" />
                  Create an Exam
                </Link>
              </div>

              <div className="p-4 md:p-6 pb-3 md:pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-base md:text-lg font-bold text-gray-900">Recent Exams</h3>
                  <select className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-bg">
                    <option>Complete</option>
                    <option>Ongoing</option>
                    <option>Pending</option>
                    <option>All</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              {isLoading && (
                <div className="px-4 md:px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && quizzes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 md:py-20">
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 text-center px-4">
                    It&apos;s a little quiet here
                  </h3>
                  <p className="text-gray-500 mb-6 text-sm text-center px-4 max-w-md">
                    Explore, create an exam or follow more people to see updates here.
                  </p>
                </div>
              )}

              {!isLoading && quizzes.length > 0 && (
                <div className="px-4 md:px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quizzes.map((quiz: any, index: number) => (
                      <QuizCard
                        key={quiz._id}
                        _id={quiz._id}
                        settings={quiz.settings}
                        questions={quiz.questions}
                        createdBy={quiz.createdBy}
                        isActive={quiz.isActive}
                        totalPoints={quiz.totalPoints}
                        createdAt={quiz.createdAt}
                        updatedAt={quiz.updatedAt}
                        participants={quiz.participants}
                        onPlay={quiz.onPlay}
                        onEdit={quiz.onEdit}
                        onDelete={quiz.onDelete}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}