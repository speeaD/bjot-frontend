import { ChevronRight, Users, ChartLine, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Sidebar() {
    return (
        <div className="col-span-3 bg-white rounded-lg shadow p-5 mb-6">
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2">
                <Image
                  src="../assets/img-user.svg"
                  alt=""
                  width={100}
                  height={100}
                />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                samuel ejiofor
              </h2>
            </div>
            <hr className="text-gray-200" />

            <Link href="/">
            <div className="flex items-center justify-between cursor-pointer my-3">
              <div className="flex items-center">
                <Image
                  src="../assets/icon-q-bg.svg"
                  alt=""
                  width={40}
                  height={40}
                  className="mr-3"
                />
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm">
                    QUIZZES
                  </h5>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div></Link>

            <hr className="text-gray-200" />
            

            <Link href="/quiz-takers">
            <div className="flex items-center justify-between cursor-pointer my-6">
              <div className="flex items-center">
                <Users
                  className="w-6 h-6 text-green-bg mr-3"
                  width={30}
                  height={30}
                />
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm">
                    QUIZ TAKERS
                  </h5>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            </Link>
            
            <Link href="/analytics">
            <div className="flex items-center justify-between cursor-pointer my-6">
              <div className="flex items-center">
                <ChartLine
                  className="w-6 h-6 text-green-bg mr-3"
                  width={30}
                  height={30}
                />
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm">
                    ANALYTICS
                  </h5>
                </div>
               
              </div>
               <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            </Link>
            <Link href="/leaderboard">
            <div className="flex items-center justify-between cursor-pointer my-6">
              <div className="flex items-center">
                <Award
                  className="w-6 h-6 text-green-bg mr-3"
                  width={30}
                  height={30}
                />
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm">
                    LEADERBOARD
                  </h5>
                </div>
                
              </div>
               <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            </Link>
          </div>
    );
}