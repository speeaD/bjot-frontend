import { CirclePlus } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-3 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Feed */}
          <div className="col-span-9">
            {/* Quiz Feed */}
            <div className="rounded-lg shadow">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-800">Quiz Feed</h2>
                <Link className="px-6 py-2 bg-green-bg text-white rounded-lg font-medium hover:bg-green-700 flex items-center" href="/create-quiz">
                  <CirclePlus className="w-4 h-4 mr-2" />
                  Create a Quiz
                </Link>
              </div>

              {/* Empty State */}
              {quizzes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="mb-6">
                    <Image src="/assets/illustration.jpg" alt="No quizzes" width={200} height={200} />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">It&apos;s a little quiet here</h3>
                  <p className="text-gray-500 mb-6 text-sm">Explore, create a quiz or follow more people to see updates here.</p>
                  <button className="px-6 py-2 bg-blue-bg text-white rounded-lg font-medium hover:bg-indigo-700">
                    Explore quizzes
                  </button>
                </div>
              )}
              <div className="max-w-6xl py-6 px-4">
                <div className="grid grid-cols-1 gap-6">
                  {quizzes.map(quiz => (
                    <QuizCard
                      key={quiz._id}
                      {...quiz}
                      onPlay={(id) => alert(`Starting quiz: ${id}`)}
                      onEdit={(id) => alert(`Editing quiz: ${id}`)}
                      onDelete={(id) => alert(`Deleting quiz: ${id}`)}
                    />
                  ))}
                </div>
              </div>
              <div>
                {/* Quiz Feed */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
