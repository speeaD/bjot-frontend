import { CirclePlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import QuizCard from "./componets/QuizCard";
import { getQuizzes } from "./lib/data";
import Sidebar from "./componets/Sidebar";
import { Suspense } from "react";

// Loading component for the quiz grid
function QuizGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
      ))}
    </div>
  );
}

// Loading component for sidebar cards
function SidebarCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Separate component for quiz content to enable Suspense
async function QuizContent() {
  const sampleQuizzes = await getQuizzes();
  const quizzes = Array.isArray(sampleQuizzes) ? sampleQuizzes : [];

  console.log('Fetched quizzes:', quizzes[0]);

  return (
    <>
      {/* Empty State */}
      {quizzes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 md:py-20">
          <div className="mb-6">
            <Image
              src="/assets/illustration.jpg"
              alt="No quizzes"
              width={200}
              height={200}
              className="w-32 h-32 md:w-48 md:h-48"
            />
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 text-center px-4">
            It&apos;s a little quiet here
          </h3>
          <p className="text-gray-500 mb-6 text-sm text-center px-4 max-w-md">
            Explore, create an exam or follow more people to see updates here.
          </p>
          <button className="px-6 py-2 bg-blue-bg text-white rounded-lg font-medium hover:opacity-90">
            Explore quizzes
          </button>
        </div>
      )}

      {/* Quiz Cards - Grid Layout */}
      {quizzes.length > 0 && (
        <div className="px-4 md:px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz, index) => (
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
    </>
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left Sidebar - Hidden on mobile, shown on large screens */}
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
              {/* Header */}
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

              {/* Recent Quizzes Header */}
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

              {/* Quiz Content with Suspense */}
              <Suspense fallback={
                <div className="px-4 md:px-6 pb-6">
                  <QuizGridSkeleton />
                </div>
              }>
                <QuizContent />
              </Suspense>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}