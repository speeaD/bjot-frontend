/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface Batch {
  _id: string;
  batchNumber: number;
  name: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
  createdAt: string;
}

interface BatchManagerProps {
  questionSetId: string;
  questionSetTitle: string;
  usesBatches: boolean;
}

export default function BatchManager({ 
  questionSetId, 
  questionSetTitle,
  usesBatches: initialUsesBatches 
}: BatchManagerProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usesBatches, setUsesBatches] = useState(initialUsesBatches);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  useEffect(() => {
    if (usesBatches) {
      fetchBatches();
    }
  }, [questionSetId, usesBatches]);

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/questionset/${questionSetId}/batches`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }

      const data = await response.json();
      setBatches(data.batches || []);
      setUsesBatches(data.usesBatches || false);
    } catch (error) {
      console.error('Error fetching batches:', error);
      alert('Failed to load batches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToBatches = async () => {
    if (!confirm('Convert this question set to use batches? All existing questions will be moved to "Batch 1".')) {
      return;
    }

    try {
      const response = await fetch(`/api/questionset/${questionSetId}/convert-to-batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert to batches');
      }

      alert('Question set converted to batch structure successfully!');
      setUsesBatches(true);
      fetchBatches();
    } catch (error) {
      console.error('Error converting to batches:', error);
      alert(error instanceof Error ? error.message : 'Failed to convert to batches');
    }
  };

  const handleToggleActive = async (batchId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/questionset/${questionSetId}/batches/${batchId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle batch status');
      }

      alert(`Batch ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      fetchBatches();
    } catch (error) {
      console.error('Error toggling batch status:', error);
      alert('Failed to toggle batch status');
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to delete "${batchName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/questionset/${questionSetId}/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete batch');
      }

      alert('Batch deleted successfully!');
      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete batch');
    }
  };

  if (!usesBatches) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Batch System Not Enabled
          </h3>
          <p className="text-gray-600 mb-6">
            This question set is not using the batch system. Convert it to organize questions into batches.
          </p>
          <button
            onClick={handleConvertToBatches}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Convert to Batch System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Batch Management</h2>
          <p className="text-gray-600 mt-1">{questionSetTitle}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Batch
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No batches found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first batch to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className={`border rounded-lg p-4 ${
                batch.isActive ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {batch.name}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Batch #{batch.batchNumber}
                    </span>
                    {!batch.isActive && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex gap-6 mt-2 text-sm text-gray-600">
                    <span>
                      <strong>{batch.questionCount}</strong> questions
                    </span>
                    <span>
                      <strong>{batch.totalPoints}</strong> points
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingBatch(batch)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit batch"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleToggleActive(batch._id, batch.isActive)}
                    className={`p-2 rounded-lg ${
                      batch.isActive
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={batch.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {batch.isActive ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteBatch(batch._id, batch.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete batch"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Batch Modal */}
      {(showAddModal || editingBatch) && (
        <AddEditBatchModal
          questionSetId={questionSetId}
          batch={editingBatch}
          existingBatches={batches}
          onClose={() => {
            setShowAddModal(false);
            setEditingBatch(null);
          }}
          onSuccess={() => {
            fetchBatches();
            setShowAddModal(false);
            setEditingBatch(null);
          }}
        />
      )}
    </div>
  );
}

// Add/Edit Batch Modal Component
interface AddEditBatchModalProps {
  questionSetId: string;
  batch: Batch | null;
  existingBatches: Batch[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddEditBatchModal({ 
  questionSetId, 
  batch, 
  existingBatches,
  onClose, 
  onSuccess 
}: AddEditBatchModalProps) {
  const [batchNumber, setBatchNumber] = useState(batch?.batchNumber || getNextBatchNumber());
  const [batchName, setBatchName] = useState(batch?.name || `Batch ${getNextBatchNumber()}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getNextBatchNumber() {
    if (existingBatches.length === 0) return 1;
    return Math.max(...existingBatches.map(b => b.batchNumber)) + 1;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchName.trim()) {
      alert('Batch name is required');
      return;
    }

    // Check for duplicate batch number (only when adding new)
    if (!batch && existingBatches.some(b => b.batchNumber === batchNumber)) {
      alert(`Batch number ${batchNumber} already exists`);
      return;
    }

    try {
      setIsSubmitting(true);

      const url = batch 
        ? `/api/questionset/${questionSetId}/batches/${batch._id}`
        : `/api/questionset/${questionSetId}/batches`;

      const method = batch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchNumber,
          name: batchName.trim(),
          questions: [], // Empty for now, questions can be added separately
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save batch');
      }

      alert(`Batch ${batch ? 'updated' : 'created'} successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error saving batch:', error);
      alert(error instanceof Error ? error.message : 'Failed to save batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {batch ? 'Edit Batch' : 'Add New Batch'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Number <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(parseInt(e.target.value) || 1)}
              min="1"
              disabled={!!batch} // Can't change batch number when editing
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Batch 1 - Easy"
            />
          </div>

          {!batch && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Note:</strong> You can add questions to this batch after creation.
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : batch ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}