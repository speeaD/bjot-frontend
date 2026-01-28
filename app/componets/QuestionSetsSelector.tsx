'use client';

import { RefreshCw, BookOpen, FileText, Award } from "lucide-react";
import { useState } from "react";

interface QuestionSet {
  _id: string;
  title: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
  createdAt: string;
}

interface QuestionSetsSelectorProps {
  availableQuestionSets: QuestionSet[];
  selectedQuestionSetIds: (string | null)[];
  onQuestionSetChange: (index: number, questionSetId: string | null) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function QuestionSetsSelector({
  availableQuestionSets,
  selectedQuestionSetIds,
  onQuestionSetChange,
  isLoading,
  onRefresh
}: QuestionSetsSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuestionSets = availableQuestionSets.filter(qs =>
    qs.title.toLowerCase().includes(searchTerm.toLowerCase()) && qs.isActive
  );

  const isQuestionSetSelected = (questionSetId: string): boolean => {
    return selectedQuestionSetIds.includes(questionSetId);
  };

  const getQuestionSetDetails = (questionSetId: string | null): QuestionSet | null => {
    if (!questionSetId) return null;
    return availableQuestionSets.find(qs => qs._id === questionSetId) || null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Select 4 Question Sets</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose exactly 4 different question sets to combine into this quiz
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Selected Question Sets Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[0, 1, 2, 3].map((index) => {
          const selectedSet = getQuestionSetDetails(selectedQuestionSetIds[index]);
          
          return (
            <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">
                  Subject {index + 1}
                </h3>
                {selectedSet && (
                  <button
                    onClick={() => onQuestionSetChange(index, null)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              {selectedSet ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        {selectedSet.title}
                      </h4>
                      <div className="flex gap-4 text-xs text-blue-700">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{selectedSet.questionCount} questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>{selectedSet.totalPoints} points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No set selected</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Available Question Sets */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Available Question Sets ({filteredQuestionSets.length})
        </h3>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search question sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Question Sets List */}
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
            <p className="text-gray-600">Loading question sets...</p>
          </div>
        ) : filteredQuestionSets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 font-medium">No question sets available</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Try a different search term' : 'Create question sets first'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {filteredQuestionSets.map((questionSet) => {
              const isSelected = isQuestionSetSelected(questionSet._id);
              const canSelect = selectedQuestionSetIds.filter(id => id !== null).length < 4;
              
              return (
                <div
                  key={questionSet._id}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {questionSet.title}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{questionSet.questionCount} questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>{questionSet.totalPoints} points</span>
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Selected
                        </span>
                      </div>
                    ) : (
                      <select
                        onChange={(e) => {
                          const selectedIndex = parseInt(e.target.value);
                          if (selectedIndex >= 0) {
                            onQuestionSetChange(selectedIndex, questionSet._id);
                          }
                        }}
                        value=""
                        disabled={!canSelect}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Add to...</option>
                        {[0, 1, 2, 3].map((index) => (
                          selectedQuestionSetIds[index] === null && (
                            <option key={index} value={index}>
                              Subject {index + 1}
                            </option>
                          )
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}