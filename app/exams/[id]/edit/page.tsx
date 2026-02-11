/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Save, 
  X,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  FileText
} from "lucide-react";
import { getQuizById } from "@/app/lib/data";

// Types
interface Question {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  order: number;
  originalQuestionId: string;
}

interface QuestionSet {
  questionSetId: string;
  batchNumber?: number;
  batchId?: string;
  batchName?: string;
  title: string;
  questions: Question[];
  totalPoints: number;
  order: number;
}

interface ExamSettings {
  coverImage: string;
  title: string;
  isQuizChallenge: boolean;
  isOpenQuiz: boolean;
  description: string;
  instructions: string;
  duration: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  multipleAttempts: boolean;
  looseFocus: boolean;
  viewAnswer: boolean;
  viewResults: boolean;
  displayCalculator: boolean;
}

interface Exam {
  _id: string;
  settings: ExamSettings;
  questionSets: QuestionSet[];
  questionSetCombination: string[];
  batchConfiguration?: Array<{
    questionSetId: string;
    batchNumber: number;
  }>;
  createdBy: {
    _id: string;
    email: string;
  };
  isActive: boolean;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

interface AvailableQuestionSet {
  _id: string;
  title: string;
  totalPoints: number;
  questionsCount: number;
  usesBatches: boolean;
  batches?: Array<{
    _id: string;
    batchNumber: number;
    name: string;
    totalPoints: number;
    questionsCount: number;
  }>;
}

export default function ExamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableQuestionSets, setAvailableQuestionSets] = useState<AvailableQuestionSet[]>([]);
  
  // Form state
  const [settings, setSettings] = useState<ExamSettings>({
    coverImage: "",
    title: "",
    isQuizChallenge: false,
    isOpenQuiz: false,
    description: "",
    instructions: "",
    duration: { hours: 0, minutes: 30, seconds: 0 },
    multipleAttempts: false,
    looseFocus: false,
    viewAnswer: true,
    viewResults: true,
    displayCalculator: false,
  });

  const [selectedQuestionSets, setSelectedQuestionSets] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Record<string, number>>({});

  // Fetch exam data
  useEffect(() => {
    fetchExamData();
    fetchAvailableQuestionSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const fetchExamData = async () => {
    const id = (await params).id;
    try {
        const res = await fetch(`/api/quiz/${id}`);
      if (!res.ok) throw new Error('Failed to load quiz');
      const data = await res.json();
      setExam(data.quiz);
      setSettings(data.quiz.settings);
      setSelectedQuestionSets(data.quiz.questionSetCombination || []);
      
      // Set selected batches
      const batchConfig: Record<string, number> = {};
      data.batchConfiguration?.forEach((bc: any) => {
        batchConfig[bc.questionSetId] = bc.batchNumber;
      });
      setSelectedBatches(batchConfig);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchAvailableQuestionSets = async () => {
    try {
      const res = await fetch('/api/questionset');
      if (!res.ok) throw new Error('Failed to fetch question sets');
      
      const data = await res.json();
      setAvailableQuestionSets(data.questionSets || []);
    } catch (err) {
      console.error('Error fetching question sets:', err);
    }
  };

  const handleSettingChange = (field: keyof ExamSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDurationChange = (field: 'hours' | 'minutes' | 'seconds', value: number) => {
    setSettings(prev => ({
      ...prev,
      duration: {
        ...prev.duration,
        [field]: Math.max(0, value)
      }
    }));
  };

  const handleQuestionSetSelect = (setId: string, index: number) => {
    const newSelected = [...selectedQuestionSets];
    newSelected[index] = setId;
    setSelectedQuestionSets(newSelected);
    
    // Clear batch selection if question set changes
    const newBatches = { ...selectedBatches };
    delete newBatches[selectedQuestionSets[index]];
    setSelectedBatches(newBatches);
  };

  const handleBatchSelect = (setId: string, batchNumber: number) => {
    setSelectedBatches(prev => ({
      ...prev,
      [setId]: batchNumber
    }));
  };

  const addQuestionSetSlot = () => {
    if (selectedQuestionSets.length < 4) {
      setSelectedQuestionSets([...selectedQuestionSets, ""]);
    }
  };

  const removeQuestionSetSlot = (index: number) => {
    const newSelected = selectedQuestionSets.filter((_, i) => i !== index);
    setSelectedQuestionSets(newSelected);
    
    // Remove batch selection for removed set
    const removedSetId = selectedQuestionSets[index];
    if (removedSetId) {
      const newBatches = { ...selectedBatches };
      delete newBatches[removedSetId];
      setSelectedBatches(newBatches);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const id = (await params).id;
    e.preventDefault();
    
    // Validation
    if (!settings.title) {
      setError('Exam title is required');
      return;
    }
    
    if (selectedQuestionSets.length !== 4) {
      setError('Exactly 4 question sets are required');
      return;
    }
    
    if (selectedQuestionSets.some(id => !id)) {
      setError('All question set slots must be filled');
      return;
    }
    
    // Check for duplicates
    const uniqueSets = new Set(selectedQuestionSets);
    if (uniqueSets.size !== 4) {
      setError('Cannot use the same question set multiple times');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Update settings
      const settingsRes = await fetch(`/api/quiz/${id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      
      if (!settingsRes.ok) throw new Error('Failed to update settings');
      
      // Update question sets
      const batchConfiguration = selectedQuestionSets
        .map(setId => {
          const questionSet = availableQuestionSets.find(qs => qs._id === setId);
          if (questionSet?.usesBatches && selectedBatches[setId]) {
            return {
              questionSetId: setId,
              batchNumber: selectedBatches[setId]
            };
          }
          return null;
        })
        .filter(Boolean);
      
      const setsRes = await fetch(`/api/quiz/${id}/question-sets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionSetIds: selectedQuestionSets,
          batchConfiguration
        })
      });
      
      if (!setsRes.ok) throw new Error('Failed to update question sets');
      
      // Redirect to exam detail page
      window.location.href = `/exam/${id}`;
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Exam not found</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Go back to exams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={`/`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exam
          </Link>
          
          <h1 className="text-2xl font-bold text-gray-900">Edit Exam</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title *
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => handleSettingChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter exam title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => handleSettingChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter exam description"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={settings.instructions}
                  onChange={(e) => handleSettingChange('instructions', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter exam instructions for students"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={settings.coverImage}
                    onChange={(e) => handleSettingChange('coverImage', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
                {settings.coverImage && (
                  <div className="mt-3 w-full h-32 relative rounded-lg overflow-hidden">
                    <Image
                      src={settings.coverImage}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hours</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.duration.hours}
                      onChange={(e) => handleDurationChange('hours', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={settings.duration.minutes}
                      onChange={(e) => handleDurationChange('minutes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Seconds</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={settings.duration.seconds}
                      onChange={(e) => handleDurationChange('seconds', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Options */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Exam Options</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">Quiz Challenge</span>
                <input
                  type="checkbox"
                  checked={settings.isQuizChallenge}
                  onChange={(e) => handleSettingChange('isQuizChallenge', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">Open Quiz</span>
                <input
                  type="checkbox"
                  checked={settings.isOpenQuiz}
                  onChange={(e) => handleSettingChange('isOpenQuiz', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">Multiple Attempts</span>
                <input
                  type="checkbox"
                  checked={settings.multipleAttempts}
                  onChange={(e) => handleSettingChange('multipleAttempts', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">Allow Lose Focus</span>
                <input
                  type="checkbox"
                  checked={settings.looseFocus}
                  onChange={(e) => handleSettingChange('looseFocus', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">View Answers</span>
                <input
                  type="checkbox"
                  checked={settings.viewAnswer}
                  onChange={(e) => handleSettingChange('viewAnswer', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">View Results</span>
                <input
                  type="checkbox"
                  checked={settings.viewResults}
                  onChange={(e) => handleSettingChange('viewResults', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">Display Calculator</span>
                <input
                  type="checkbox"
                  checked={settings.displayCalculator}
                  onChange={(e) => handleSettingChange('displayCalculator', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Question Sets */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Question Sets ({selectedQuestionSets.length}/4)
              </h2>
              {selectedQuestionSets.length < 4 && (
                <button
                  type="button"
                  onClick={addQuestionSetSlot}
                  className="px-4 py-2 bg-blue-bg text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Set
                </button>
              )}
            </div>

            <div className="space-y-4">
              {selectedQuestionSets.map((setId, index) => {
                const selectedSet = availableQuestionSets.find(qs => qs._id === setId);
                
                return (
                  <div key={index} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Set {index + 1} *
                          </label>
                          <select
                            value={setId}
                            onChange={(e) => handleQuestionSetSelect(e.target.value, index)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select a question set</option>
                            {availableQuestionSets.map(qs => (
                              <option 
                                key={qs._id} 
                                value={qs._id}
                                disabled={selectedQuestionSets.includes(qs._id) && qs._id !== setId}
                              >
                                {qs.title} ({qs.questionsCount} questions, {qs.totalPoints} pts)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Batch selection if applicable */}
                        {selectedSet?.usesBatches && selectedSet.batches && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Batch *
                            </label>
                            <select
                              value={selectedBatches[setId] || ""}
                              onChange={(e) => handleBatchSelect(setId, parseInt(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select a batch</option>
                              {selectedSet.batches.map(batch => (
                                <option key={batch._id} value={batch.batchNumber}>
                                  Batch {batch.batchNumber}: {batch.name} ({batch.questionsCount} questions, {batch.totalPoints} pts)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {selectedSet && (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Questions</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {selectedSet.questionsCount}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Total Points</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {selectedSet.totalPoints}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Type</p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedSet.usesBatches ? 'Batched' : 'Standard'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestionSetSlot(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {selectedQuestionSets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No question sets added yet.</p>
                  <p className="text-sm">Click &quot;Add Set&quot; to add a question set.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <Link
              href={`/`}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-green-bg text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}