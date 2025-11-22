'use client';

import {ChevronRight, CirclePlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";


export default function Home() {
  const [quizKey, setQuizKey] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
     <div className="max-w-7xl mx-auto px-3 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-3 bg-white rounded-lg shadow p-5 mb-6">
            {/* Profile Card */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                  <Image src="../assets/img-user.svg" alt="" width={100} height={100}/>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">samuel ejiofor</h2>
              </div>
          

            {/* Quizzes Section */}
              <hr className="text-gray-200"></hr>
              <div className="flex items-center justify-between cursor-pointer my-3">
                <div className="flex items-center">
                  <Image src="../assets/icon-q-bg.svg" alt="" width={40} height={40} className="mr-3"/>
                  <div className="">
                    <h5 className="font-semibold text-gray-800 text-sm">QUIZZES</h5>
                    {/* <p className="text-sm text-gray-500">
                      Created • <span className="font-semibold">0</span> Attempted • <span className="font-semibold">0</span> <span></span>
                    </p> */}
                  </div>
                </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
          

            {/* People Section */}
            {/* <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">PEOPLE</h3>
                    <p className="text-sm text-gray-500">
                      Followers • <span className="font-semibold">0</span> Following • <span className="font-semibold">0</span>
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">›</span>
              </div>
            </div> */}
            
          </div>

          {/* Main Feed */}
          <div className="col-span-9">
            {/* Join Quiz Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image src="../assets/icon-q.svg" alt="" width={64} height={64} className="mx-5" />
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-1">Edit Quiz</h2>
                    <p className="text-gray-600">Enter quiz key to edit a quiz</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Enter quiz key"
                    value={quizKey}
                    onChange={(e) => setQuizKey(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-bg w-64"
                  />
                  <button className="px-6 py-2 bg-blue-bg text-white rounded-lg font-medium hover:bg-blue-bg-700">
                    Edit Quiz
                  </button>
                </div>
              </div>
            </div>

            {/* Quiz Feed */}
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-800">Quiz Feed</h2>
                <Link className="px-6 py-2 bg-green-bg text-white rounded-lg font-medium hover:bg-green-700 flex items-center" href="/create-quiz">
                  <CirclePlus className="w-4 h-4 mr-2" />
                  Create a Quiz
                </Link>
              </div>

              {/* Empty State */}
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
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Community Button */}
      
    </div>
  );
}
