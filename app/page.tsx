import { CirclePlus} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import QuizCard from "./componets/QuizCard";
import { getQuizzes } from "./lib/data";
import Sidebar from "./componets/Sidebar";

export default async function Home() {
  const sampleQuizzes = await getQuizzes();
  const quizzes = Array.isArray(sampleQuizzes) ? sampleQuizzes : [];
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="col-span-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">Exam Feed</h2>
                  <Link 
                    className="px-4 py-3 bg-green-bg text-white rounded-xl font-sm hover:opacity-90 transition-opacity flex items-center gap-2" 
                    href="/create-quiz"
                  >
                    <CirclePlus className="w-5 h-5" />
                    Create an Exam
                  </Link>
                </div>
              </div>

              {/* Recent Quizzes Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recent Exams</h3>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-bg">
                    <option>Complete</option>
                    <option>Ongoing</option>
                    <option>Pending</option>
                    <option>All</option>
                  </select>
                </div>
              </div>

              {/* Empty State */}
              {quizzes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="mb-6">
                    <Image src="/assets/illustration.jpg" alt="No quizzes" width={200} height={200} />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">It&apos;s a little quiet here</h3>
                  <p className="text-gray-500 mb-6 text-sm">Explore, create an exam or follow more people to see updates here.</p>
                  <button className="px-6 py-2 bg-blue-bg text-white rounded-lg font-medium hover:opacity-90">
                    Explore quizzes
                  </button>
                </div>
              )}

              {/* Quiz Cards */}
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {quizzes.map((quiz, index) => (
                    <QuizCard
                      key={quiz._id}
                      {...quiz}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Top Quiz Takers */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Top Exam Takers
              </h3>
              <div className="space-y-4">
                {[
                  { name: 'samuel ejiofor', quizzes: 83, edition: 'Edition' },
                  { name: 'nady Naher', quizzes: 15, edition: 'Edition' },
                  { name: 'Anix Luride', quizzes: 1, edition: 'Edition' }
                ].map((taker, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        <Image
                          src="/assets/img-user.svg"
                          alt={taker.name}
                          width={40}
                          height={40}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {taker.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {taker.quizzes} Exam Takers
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 bg-green-50 text-green-bg rounded-md font-medium">
                      {taker.edition}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Analytics Overview */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Analytics Overview
              </h3>
              <div className="space-y-4">
                {/* Simple line chart representation */}
                <div className="h-40 flex items-end justify-between gap-2">
                  {[20, 35, 25, 45, 30, 50, 60].map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col justify-end">
                      <div 
                        className="bg-gray-200 rounded-t-sm transition-all hover:bg-blue-bg"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Views</span>
                    <span className="text-lg font-bold text-gray-900">100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}