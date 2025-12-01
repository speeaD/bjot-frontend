'use client';

import { Plus, Bot } from "lucide-react";
import QuestionCard from "./QuestionCard";
import BulkUpload from "./BulkUpload";
interface QuestionsSettingsProps {
    questions: Question[];
    onQuestionsChange: (questions: Question[]) => void;
}

export default function QuestionsSettings({ questions, onQuestionsChange }: QuestionsSettingsProps) {
    const totalMarks = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    const addQuestion = () => {
        onQuestionsChange([
            ...questions,
            {
                type: 'multiple-choice',
                question: '',
                options: ['', '', '', ''],
                correctAnswer: '',
                points: 1,
                order: questions.length + 1
            }
        ]);
    };

    const updateQuestion = (index: number, updatedQuestion: Question) => {
        const newQuestions = [...questions];
        newQuestions[index] = updatedQuestion;
        onQuestionsChange(newQuestions);
    };

    const deleteQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        onQuestionsChange(newQuestions);
    };
    return (
        <div className="space-y-6">

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
                <div className="px-4 py-2 bg-green-600 text-white font-bold rounded">
                    {totalMarks}
                </div>
            </div>



            {/* Question Card */}
            <div className="space-y-4">
                {questions.map((question, index) => (
                    <QuestionCard
                        key={index}
                        question={question}
                        index={index}
                        onUpdate={updateQuestion}
                        onDelete={deleteQuestion}
                    />
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={addQuestion}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-bg text-white rounded-lg font-medium hover:bg-blue-bg-700">
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
            <BulkUpload />
            <div className="text-center">
                
                <p className="mt-4 text-gray-600">
                    Make sure to upload an .xlsx file in this format{' '}
                    <a href="#" className="text-blue-bg hover:underline">(Download template)</a>
                </p>
            </div>
        </div>
    );
}