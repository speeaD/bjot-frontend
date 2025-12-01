'use client';

import { Trash2, ChevronDown } from "lucide-react";
import { ChangeEvent, useState } from "react";

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (index: number, question: Question) => void;
  onDelete: (index: number) => void;
}

export default function QuestionCard({ question, index, onUpdate, onDelete }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleOptionChange = (optIdx: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[optIdx] = value;
    onUpdate(index, { ...question, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...question.options, ''];
    onUpdate(index, { ...question, options: newOptions });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-800">{index + 1}</span>
          <select
            value={question.type}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => 
              onUpdate(index, { ...question, type: e.target.value as QuestionType })
            }
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded font-medium text-sm"
          >
            <option value="multiple-choice">MULTIPLE CHOICE</option>
            <option value="essay">ESSAY</option>
            <option value="true-false">TRUE/FALSE</option>
            <option value="fill-blank">FILL IN THE BLANK</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => onDelete(index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div>
            <label htmlFor={`question-${index}`} className="block text-sm font-semibold text-gray-700 mb-2">
              Question
            </label>
            <textarea
              id={`question-${index}`}
              value={question.question}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                onUpdate(index, { ...question, question: e.target.value })
              }
              placeholder="Enter your question here..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {question.type === 'multiple-choice' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Options</label>
              {question.options.map((option, optIdx) => (
                <div key={optIdx} className="flex gap-2 mb-2">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={question.correctAnswer === option}
                    onChange={() => onUpdate(index, { ...question, correctAnswer: option })}
                    className="mt-3"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleOptionChange(optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-indigo-600 text-sm font-medium hover:underline"
              >
                + Add option
              </button>
            </div>
          )}

          <div className="flex gap-4">
            <div>
              <label htmlFor={`points-${index}`} className="block text-sm font-semibold text-gray-700 mb-2">
                Points
              </label>
              <input
                id={`points-${index}`}
                type="number"
                value={question.points}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  onUpdate(index, { ...question, points: Number(e.target.value) })
                }
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}