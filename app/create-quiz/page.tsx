'use client';

import { ArrowLeft, Eye } from "lucide-react";
import { useState } from "react";
import QuizSettings from "../componets/QuizSettings";
import QuestionsSettings from "../componets/QuestionsSettings";

export default function CreateQuiz() {
    const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details');

    const [settings, setSettings] = useState({
        coverImage: '',
        title: '',
        description: '',
        instructions: '',
        isQuizChallenge: false,
        duration: { hours: 0, minutes: 0, seconds: 0 },
        shuffleQuestions: true,
        multipleAttempts: true,
        requireLogin: true,
        permitLoseFocus: true,
        viewAnswer: true,
        viewResults: true,
        displayCalculator: false
    });

    const [questions, setQuestions] = useState<Question[]>([
    {
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      order: 1
    }
  ]);
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                        <button className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Create Quiz</h1>
                    </div>
                    <button className="flex items-center px-6 py-2 border border-gray-300 rounded-lg hover:bg-blue-bg-200">
                        <Eye className="w-5 h-5 mr-2 text-blue-bg" />
                        <span className="font-medium text-blue-bg">Preview</span>
                    </button>
                </div>
            </header>
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar */}
                    <div className="col-span-2 items-center">

                        <button
                            onClick={() => setActiveTab('details')}
                            className={`w-full px-4 py-4 text-left font-semibold rounded-lg my-1  ${activeTab === 'details'
                                ? 'bg-blue-bg text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >Quiz Details</button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`w-full px-4 py-4 text-left font-semibold rounded-lg my-1 ${activeTab === 'questions'
                                ? 'bg-blue-bg text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >Questions</button>
                    </div>
                    <div className="col-span-10">
                        {activeTab === 'details' && (
                            <><QuizSettings
                                settings={settings}
                                onSettingsChange={setSettings}
                            />
                                <button className="px-6 py-2 my-6 bg-blue-bg text-white rounded-lg font-medium hover:bg-indigo-700">
                                    Next
                                </button></>

                        )}
                        {activeTab === 'questions' && (
                            <><QuestionsSettings
                                questions={questions}
                                onQuestionsChange={setQuestions}
                            />
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('details')}
                                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                    >
                                        Back
                                    </button>
                                    {/* <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
                                    </button> */}
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}