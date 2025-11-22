import { Plus, Bot, Upload } from "lucide-react";
import { useState } from "react";

export default function QuestionsSettings() {
    const [totalMarks, setTotalMarks] = useState(0);
    // const [passmark, setPassmark] = useState(60);
    const [questions] = useState([
        { id: 1, type: 'MULTIPLECHOICE', isEmpty: true }
    ]);
    return (
        <div className="space-y-6">
            {/* Add Question Set */}
            {/* <button className="flex items-center text-gray-600 hover:text-gray-800 font-medium">
                <Plus className="w-5 h-5 mr-2" />
                Add question set
            </button> */}

            {/* Question Counter */}
            <div className="text-lg font-semibold text-gray-800">
                1/{questions.length} Question(s)
            </div>

            {/* Instructions */}
            <p className="text-gray-600 text-sm">
                You can add Multiple Choice, Essay Type, Multiple Answers, Fill In the blanks, True or False and question types that require users to Record answers
            </p>

            {/* Total Marks */}
            <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-700 text-sm">TOTAL MARKS:</span>
                <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-15 px-3 py-2 bg-green-sec-bg text-white font-bold rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <button className="px-4 py-2 bg-blue-bg text-white rounded-lg font-medium text-sm">
                    Apply
                </button>
            </div>

            <p className="text-sm text-gray-600">
                <span className="font-semibold">Note:</span> If you apply changes made to total marks, the mark on each answer will change to the average of total correct answers.
            </p>

            {/* Question Card */}
            {/* <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-800">1</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded font-medium text-sm">
                            MULTIPLECHOICE
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-red-500 hover:bg-red-50 rounded">
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="text-center py-12">
                    <span className="text-2xl font-semibold text-yellow-500">Empty question</span>
                </div>
            </div> */}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-bg text-white rounded-lg font-medium hover:bg-blue-bg-700">
                    <Plus className="w-5 h-5 mr-2" />
                    Add new question
                </button>
                <button className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-blue-bg text-blue-bg rounded-lg font-medium hover:bg-blue-bg hover:text-white">
                    <Bot className="w-5 h-5 mr-2" />
                    Write with AI
                </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 font-medium">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Import from Spreadsheet */}
            <div className="text-center">
                <button className="inline-flex items-center px-6 py-3 border-2 border-gray-600 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                    <Upload className="w-5 h-5 mr-2" />
                    Import from spreadsheet
                </button>
                <p className="mt-4 text-gray-600">
                    Make sure to upload an .xlsx file in this format{' '}
                    <a href="#" className="text-blue-bg hover:underline">(Download template)</a>
                </p>
            </div>
        </div>
    );
}