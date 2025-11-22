'use client';

import { useState } from "react";
import ToggleButton from "./ToggleButton";

export default function QuizSettings() {
    const [visibility, setVisibility] = useState('public');
    const [shuffleQuestions, setShuffleQuestions] = useState(true);
    const [multipleAttempts, setMultipleAttempts] = useState(true);
    const [requireLogin, setRequireLogin] = useState(true);
    const [permitLoseFocus, setPermitLoseFocus] = useState(true);
    const [allowViewAnswer, setAllowViewAnswer] = useState(true);
    const [allowViewResult, setAllowViewResult] = useState(true);
    const [displayCalculator, setDisplayCalculator] = useState(true);
    const [isChallenge, setIsChallenge] = useState(false);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    return (
        <div className="space-y-4">
            {/* Public/Private Toggle */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setVisibility('public')}
                        className={`flex-1 pb-3 font-semibold ${visibility === 'public'
                                ? 'text-green-600 border-b-4 border-green-600'
                                : 'text-gray-500'
                            }`}
                    >
                        Public
                    </button>
                    <button
                        onClick={() => setVisibility('private')}
                        className={`flex-1 pb-3 font-semibold ${visibility === 'private'
                                ? 'text-green-600 border-b-4 border-green-600'
                                : 'text-gray-500'
                            }`}
                    >
                        Private
                    </button>
                </div>
                <p className="mt-6 text-gray-600 text-center">
                    If you create a public quiz, anyone would be able to search and find your quiz. You can change this settings later.
                </p>
            </div>
            {/* Cover Image */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-gray-400 text-xs mb-4">OPTIONAL</span>
                        <button className="px-6 py-2 border-2 border-blue-bg text-blue-bg rounded-lg font-medium hover:bg-blue-bg hover:text-white ">
                            Add a cover image
                        </button>
                    </div>
                </div>
            </div>

            {/* Quiz Title */}
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Quiz Title
                </label>
                <input
                    type="text"
                    placeholder="Make it short and simple."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            {/* Make quiz a challenge */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Make quiz a challenge?</h3>
                        <p className="text-gray-600">
                            If you make this quiz a challenge, people can participate to win a prize you set on the quiz
                        </p>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-3 font-semibold text-gray-700">No</span>
                        <button
                            onClick={() => setIsChallenge(!isChallenge)}
                            className={`w-12 h-6 rounded-full transition-colors ${isChallenge ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isChallenge ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Description <span className="text-xs font-normal text-gray-500">OPTIONAL</span>
                </label>
                <textarea
                    placeholder="Add a short description"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Instruction */}
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Instruction <span className="text-xs font-normal text-gray-500">OPTIONAL</span>
                </label>
                <textarea
                    placeholder="Tell people how you want them to answer the quiz"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Duration <span className="text-xs font-normal text-gray-500">OPTIONAL</span>
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg mb-4">
                    Set how long it would take to complete this quiz
                </p>
                <div className="flex gap-4">
                    <div>
                        <select
                            value={hours}
                            onChange={(e) => setHours(Number(e.target.value))}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
                        >
                            {[...Array(24)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                        <div className="text-sm font-semibold text-gray-700 mt-2">HR</div>
                    </div>
                    <div>
                        <select
                            value={minutes}
                            onChange={(e) => setMinutes(Number(e.target.value))}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
                        >
                            {[...Array(60)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                        <div className="text-sm font-semibold text-gray-700 mt-2">MIN</div>
                    </div>
                    <div>
                        <select
                            value={seconds}
                            onChange={(e) => setSeconds(Number(e.target.value))}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
                        >
                            {[...Array(60)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                        <div className="text-sm font-semibold text-gray-700 mt-2">SEC</div>
                    </div>
                </div>
            </div>
            {/* Quiz Settings */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Shuffle Questions And Answers?</h3>
                    <ToggleButton value={shuffleQuestions} onChange={setShuffleQuestions} />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Allow People Attempt This Quiz Multiple Times?</h3>
                    <ToggleButton value={multipleAttempts} onChange={setMultipleAttempts} />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Ensure People Signup/Login To Attempt Quiz?</h3>
                    <ToggleButton value={requireLogin} onChange={setRequireLogin} />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Permit Users To Lose Focus?</h3>
                    <ToggleButton value={permitLoseFocus} onChange={setPermitLoseFocus} />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Allow Users To View Answer?</h3>
                    <ToggleButton value={allowViewAnswer} onChange={setAllowViewAnswer} />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Allow Users To See Result?</h3>
                    <ToggleButton value={allowViewResult} onChange={setAllowViewResult} />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Display Calculator</h3>
                    <ToggleButton value={displayCalculator} onChange={setDisplayCalculator} />
                </div>
            </div>
        </div>
    );
}