import { ChevronRight, Users, ChartLine, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="col-span-3">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 sticky top-24">
        {/* User Profile Section */}
        <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
            <Image
              src="/assets/img-user.svg"
              alt="Profile"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            BJOT ADMIN
          </h2>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          <Link href="/question-set">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image
                    src="/assets/icon-q-bg.svg"
                    alt="Quizzes"
                    width={32}
                    height={32}
                  />
                </div>
                <h5 className="font-semibold text-gray-900 text-sm">
                  Questions
                </h5>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>

          <Link href="/quiz-takers">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-bg" />
                </div>
                <h5 className="font-semibold text-gray-900 text-sm">
                  Exam Takers
                </h5>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>

          <Link href="/analytics">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ChartLine className="w-5 h-5 text-blue-bg" />
                </div>
                <h5 className="font-semibold text-gray-900 text-sm">
                  Analytics
                </h5>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>

          <Link href="/leaderboard">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <h5 className="font-semibold text-gray-900 text-sm">
                  Leaderboard
                </h5>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}