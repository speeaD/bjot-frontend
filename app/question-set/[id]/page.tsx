/* eslint-disable @typescript-eslint/no-explicit-any */
// app/question-sets/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileText, Award, Plus, Upload, Trash2, Edit, Eye, ToggleLeft, ToggleRight, 
  AlertTriangle, Download 
} from 'lucide-react';
import Sidebar from "@/app/componets/Sidebar"; // adjust path

interface Question {
  _id?: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: any;
  points: number;
  order: number;
}

interface Batch {
  _id: string;
  batchNumber: number;
  name: string;
  questions: Question[];
  isActive: boolean;
  questionCount?: number; // we'll compute if not in API
}

interface QuestionSet {
  _id: string;
  title: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
  createdAt: string;
  createdBy: { email: string };
  usesBatches: boolean;
  batches?: Batch[];
  questions?: Question[]; // legacy
}

export default function QuestionSetDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add batch modal
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState<number | ''>('');
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) fetchQuestionSet();
  }, [id]);

  const fetchQuestionSet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/questionset/${id}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Failed to load');
      
      setQuestionSet(data.questionSet);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new batch with file upload
  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBatchName.trim()) return alert('Batch name is required');
    if (!newBatchNumber || newBatchNumber < 1) return alert('Valid batch number required');
    if (!batchFile) return alert('Please select a file');

    setUploading(true);

    try {
      const formData = new FormData();
     //add number not string because backend needs it
        formData.append('batchNumber', newBatchNumber.toString());
      formData.append('name', newBatchName.trim());
      formData.append('file', batchFile);

      const res = await fetch(`/api/questionset/${id}/batches`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || 'Failed to add batch');

      alert('Batch added successfully!');
      setShowAddBatchModal(false);
      setNewBatchName('');
      setNewBatchNumber('');
      setBatchFile(null);
      fetchQuestionSet();
    } catch (err: any) {
      alert(err.message || 'Error adding batch');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleBatchActive = async (batchId: string, currentActive: boolean) => {
    if (!confirm(`Are you sure you want to ${currentActive ? 'deactivate' : 'activate'} this batch?`)) return;

    try {
      const res = await fetch(`/api/questionset/${id}/batches/${batchId}/toggle-active`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error('Failed to toggle status');
      
      fetchQuestionSet();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Delete this batch? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/questionset/${id}/batches/${batchId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete');

      alert('Batch deleted');
      fetchQuestionSet();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConvertToBatches = async () => {
    if (!confirm('Convert this question set to use batches? This will move all current questions into Batch 1.')) return;

    try {
      const res = await fetch(`/api/questionset/${id}/convert-to-batches`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Conversion failed');
      
      fetchQuestionSet();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading question set...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!questionSet) return <div className="p-8">Question set not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <Sidebar />

        <div className="col-span-12 md:col-span-9">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{questionSet.title}</h1>
              <p className="text-gray-600 mt-1">
                Created by {questionSet.createdBy.email} on {new Date(questionSet.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to List
              </button>
              {questionSet.usesBatches && (
                <button
                  onClick={() => setShowAddBatchModal(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={18} /> Add Batch
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-600" size={28} />
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold">{questionSet.questionCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <Award className="text-green-600" size={28} />
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold">{questionSet.totalPoints}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                {questionSet.usesBatches ? (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Structure:</span> Batched ({questionSet.batches?.length || 0} batches)
                  </div>
                ) : (
                  <>
                    <AlertTriangle className="text-amber-600" size={28} />
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Legacy Mode</p>
                      <button
                        onClick={handleConvertToBatches}
                        className="mt-2 text-xs text-indigo-600 hover:underline"
                      >
                        Convert to Batches →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Batches List */}
          {questionSet.usesBatches ? (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Batches</h2>
              </div>

              {questionSet.batches?.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No batches yet. Add your first batch above.
                </div>
              ) : (
                <div className="divide-y">
                  {questionSet.batches?.map((batch) => (
                    <div key={batch._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-medium">
                              Batch {batch.batchNumber}: {batch.name}
                            </h3>
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                batch.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {batch.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {batch.questions?.length || 0} questions
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => router.push(`/question-sets/${id}/batches/${batch._id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
                          >
                            <Eye size={16} /> View Questions
                          </button>

                          <button
                            onClick={() => handleToggleBatchActive(batch._id, batch.isActive)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
                          >
                            {batch.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                            {batch.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          <button
                            onClick={() => handleDeleteBatch(batch._id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
              <AlertTriangle className="mx-auto text-amber-600 mb-4" size={40} />
              <h3 className="text-lg font-medium mb-2">This question set uses the legacy structure</h3>
              <p className="text-gray-700 mb-6">
                It contains {questionSet.questions?.length || 0} questions directly (no batches).
              </p>
              <button
                onClick={handleConvertToBatches}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Convert to Batch Structure
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add New Batch</h2>
            </div>

            <form onSubmit={handleAddBatch} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Number *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="e.g. Batch A - Algebra"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Questions File (Excel/CSV) *
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the same template as question set upload
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? 'Adding...' : 'Add Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}