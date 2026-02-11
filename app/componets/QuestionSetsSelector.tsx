/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { RefreshCw } from "lucide-react";

interface Batch {
  _id: string;
  batchNumber: number;
  name: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
}

interface QuestionSet {
  _id: string;
  title: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
  usesBatches: boolean;
  batches?: Batch[];
  createdAt: string;
}

interface BatchSelection {
  questionSetId: string;
  batchNumber: number | null;
}

interface QuestionSetsSelectorProps {
  availableQuestionSets: QuestionSet[];
  selectedQuestionSetIds: (string | null)[];
  batchSelections: (BatchSelection | null)[];
  onQuestionSetChange: (index: number, questionSetId: string | null) => void;
  onBatchChange: (index: number, batchNumber: number | null) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function QuestionSetsSelector({
  availableQuestionSets,
  selectedQuestionSetIds,
  batchSelections,
  onQuestionSetChange,
  onBatchChange,
  isLoading,
  onRefresh,
}: QuestionSetsSelectorProps) {
  
  const getAvailableQuestionSets = (currentIndex: number) => {
    // Filter out already selected question sets (except current)
    return availableQuestionSets.filter(qs => {
      const isSelected = selectedQuestionSetIds.some((id, idx) => 
        id === qs._id && idx !== currentIndex
      );
      return !isSelected && qs.isActive;
    });
  };

  const getSelectedQuestionSet = (index: number): QuestionSet | null => {
    const id = selectedQuestionSetIds[index];
    if (!id) return null;
    return availableQuestionSets.find(qs => qs._id === id) || null;
  };

  const getActiveBatches = (questionSet: QuestionSet): Batch[] => {
    if (!questionSet.batches) return [];
    return questionSet.batches.filter(b => b.isActive);
  };

  const renderQuestionSetSelector = (index: number) => {
    const selectedSet = getSelectedQuestionSet(index);
    const availableSets = getAvailableQuestionSets(index);
    const batchSelection = batchSelections[index];

    return (
      <div key={index} className="bg-white rounded-lg shadow p-6 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Question Set {index + 1}
          </h3>
          {selectedSet && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Selected
            </span>
          )}
        </div>

        {/* Question Set Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Question Set
          </label>
          <select
            value={selectedQuestionSetIds[index] || ''}
            onChange={(e) => onQuestionSetChange(index, e.target.value || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="">-- Select a question set --</option>
            {availableSets.map((qs) => (
              <option key={qs._id} value={qs._id}>
                {qs.title} ({qs.questionCount} questions, {qs.totalPoints} points)
                {qs.usesBatches ? ' - Has Batches' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Selector - Show only if question set uses batches */}
        {selectedSet?.usesBatches && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={batchSelection?.batchNumber || ''}
              onChange={(e) => onBatchChange(index, e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a batch --</option>
              {getActiveBatches(selectedSet).map((batch) => (
                <option key={batch._id} value={batch.batchNumber}>
                  {batch.name} ({batch.questionCount} questions, {batch.totalPoints} points)
                </option>
              ))}
            </select>
            {selectedSet.batches && selectedSet.batches.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                ⚠️ This question set has no active batches. Please contact admin.
              </p>
            )}
          </div>
        )}

        {/* Selected Question Set Details */}
        {selectedSet && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">{selectedSet.title}</h4>
            
            {selectedSet.usesBatches && batchSelection?.batchNumber ? (
              // Show batch details
              (() => {
                const batch = selectedSet.batches?.find(b => b.batchNumber === batchSelection.batchNumber);
                return batch ? (
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Batch:</span>
                      <span className="font-medium text-blue-600">{batch.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Questions:</span>
                      <span className="font-medium">{batch.questionCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Points:</span>
                      <span className="font-medium">{batch.totalPoints}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">Batch not found</p>
                );
              })()
            ) : (
              // Show question set details (legacy)
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Questions:</span>
                  <span className="font-medium">{selectedSet.questionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Points:</span>
                  <span className="font-medium">{selectedSet.totalPoints}</span>
                </div>
                {selectedSet.usesBatches && !batchSelection?.batchNumber && (
                  <p className="mt-2 text-sm text-red-600">
                    ⚠️ Please select a batch for this question set
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedSet && (
          <div className="mt-4 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-gray-500">No question set selected</p>
            <p className="text-sm text-gray-400 mt-1">
              Choose from {availableSets.length} available question set{availableSets.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Select Question Sets</h2>
          <p className="text-gray-600 mt-1">Choose exactly 4 question sets for your quiz</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Info Banner about Batches */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Batch System:</strong> Some question sets may have multiple batches. 
          If a question set uses batches, you must select which batch to use in this quiz. 
          This allows you to create different quiz variations using the same question sets.
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading question sets...</p>
        </div>
      )}

      {!isLoading && availableQuestionSets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No question sets available</p>
          <p className="text-sm text-gray-400 mt-1">
            Create question sets first before creating a quiz
          </p>
        </div>
      )}

      {!isLoading && availableQuestionSets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((index) => renderQuestionSetSelector(index))}
        </div>
      )}

      {/* Summary */}
      {selectedQuestionSetIds.filter(id => id !== null).length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="font-semibold text-gray-800 mb-2">Selection Summary</h3>
          <div className="space-y-1 text-sm">
            {selectedQuestionSetIds.map((id, index) => {
              if (!id) return null;
              const set = getSelectedQuestionSet(index);
              const batch = batchSelections[index];
              
              if (!set) return null;

              let displayText = `${index + 1}. ${set.title}`;
              
              if (set.usesBatches && batch?.batchNumber) {
                const batchObj = set.batches?.find(b => b.batchNumber === batch.batchNumber);
                if (batchObj) {
                  displayText += ` - ${batchObj.name}`;
                }
              }

              return (
                <div key={index} className="text-gray-700">
                  {displayText}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}