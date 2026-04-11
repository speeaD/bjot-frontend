/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ArrowLeft, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuizSettingsComponent from "../componets/QuizSettings";
import QuestionSetsSelector from "../componets/QuestionSetsSelector";
import { QuizSettings } from "../types/global";

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

interface CreateQuizClientProps {
  user?: any;
}

type ExamType = 'multi-subject' | 'single-subject';

export default function CreateQuizClient({ }: CreateQuizClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'question-sets'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableQuestionSets, setAvailableQuestionSets] = useState<QuestionSet[]>([]);
  const [isLoadingQuestionSets, setIsLoadingQuestionSets] = useState(false);

  // Exam type drives how many question sets are required
  const [examType, setExamType] = useState<ExamType>('multi-subject');

  const [settings, setSettings] = useState<QuizSettings>({
    coverImage: '',
    title: '',
    description: '',
    instructions: '',
    isQuizChallenge: false,
    isOpenQuiz: false,
    duration: { hours: 0, minutes: 30, seconds: 0 },
    shuffleQuestions: true,
    multipleAttempts: true,
    requireLogin: true,
    permitLoseFocus: true,
    viewAnswer: true,
    viewResults: true,
    displayCalculator: false,
  });

  const [selectedQuestionSetIds, setSelectedQuestionSetIds] = useState<(string | null)[]>([
    null, null, null, null,
  ]);

  const [batchSelections, setBatchSelections] = useState<(BatchSelection | null)[]>([
    null, null, null, null,
  ]);

  // When examType changes, reset selections to the correct size
  useEffect(() => {
    const size = examType === 'single-subject' ? 1 : 4;
    setSelectedQuestionSetIds(Array(size).fill(null));
    setBatchSelections(Array(size).fill(null));
    setErrors({});
  }, [examType]);

  // Fetch available question sets on mount
  useEffect(() => {
    fetchQuestionSets();
  }, []);

  const fetchQuestionSets = async () => {
    try {
      setIsLoadingQuestionSets(true);
      const response = await fetch('/api/questionset', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch question sets');

      const data = await response.json();
      setAvailableQuestionSets(data.questionSets || []);
    } catch (error) {
      console.error('Error fetching question sets:', error);
      alert('Failed to load question sets');
    } finally {
      setIsLoadingQuestionSets(false);
    }
  };

  const fetchBatchesForQuestionSet = async (questionSetId: string): Promise<Batch[]> => {
    try {
      const response = await fetch(`/api/questionset/${questionSetId}/batches`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch batches');

      const data = await response.json();
      return data.batches || [];
    } catch (error) {
      console.error('Error fetching batches:', error);
      return [];
    }
  };

  // ─── Derived values ──────────────────────────────────────────────────────────

  const expectedCount = examType === 'single-subject' ? 1 : 4;

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validateQuizDetails = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!settings.title.trim()) {
      newErrors.title = 'Quiz title is required';
    }

    if (settings.title.length > 200) {
      newErrors.title = 'Quiz title must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateQuestionSets = (): boolean => {
    const newErrors: Record<string, string> = {};
    const selectedCount = selectedQuestionSetIds.filter(id => id !== null).length;

    if (selectedCount !== expectedCount) {
      newErrors.questionSets = `You must select exactly ${expectedCount} question set${expectedCount > 1 ? 's' : ''}`;
    }

    // Duplicate check only relevant for multi-subject
    if (examType === 'multi-subject') {
      const uniqueSets = new Set(selectedQuestionSetIds.filter(id => id !== null));
      if (uniqueSets.size !== selectedCount) {
        newErrors.questionSets = 'You cannot select the same question set multiple times';
      }
    }

    // Validate batch selections for any batched question set (works for any size array)
    for (let i = 0; i < selectedQuestionSetIds.length; i++) {
      const setId = selectedQuestionSetIds[i];
      if (setId) {
        const questionSet = availableQuestionSets.find(qs => qs._id === setId);
        if (questionSet?.usesBatches) {
          const batchSelection = batchSelections[i];
          if (!batchSelection || !batchSelection.batchNumber) {
            newErrors.questionSets = `Please select a batch for "${questionSet.title}"`;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleExamTypeChange = (type: ExamType) => {
    setExamType(type);
    // selections are reset by the useEffect above
  };

  const handleNext = () => {
    if (validateQuizDetails()) {
      setActiveTab('question-sets');
    } else {
      alert('Please fill in all required quiz details');
    }
  };

  const handleSubmit = async () => {
    if (!validateQuestionSets()) {
      alert(
        examType === 'single-subject'
          ? 'Please select a question set (and its batch if applicable)'
          : 'Please select exactly 4 different question sets and their batches (if applicable)'
      );
      return;
    }

    if (!validateQuizDetails()) {
      alert('Please go back and fix quiz details');
      return;
    }

    try {
      setIsSubmitting(true);

      const validQuestionSetIds = selectedQuestionSetIds.filter(id => id !== null) as string[];

      if (validQuestionSetIds.length !== expectedCount) {
        throw new Error(`Must select exactly ${expectedCount} question set${expectedCount > 1 ? 's' : ''}`);
      }

      // Build batch configuration
      const batchConfiguration: Array<{ questionSetId: string; batchNumber?: number }> = [];

      for (let i = 0; i < selectedQuestionSetIds.length; i++) {
        const setId = selectedQuestionSetIds[i];
        if (setId) {
          const questionSet = availableQuestionSets.find(qs => qs._id === setId);
          const batchSelection = batchSelections[i];

          if (questionSet?.usesBatches && batchSelection?.batchNumber) {
            batchConfiguration.push({ questionSetId: setId, batchNumber: batchSelection.batchNumber });
          } else {
            batchConfiguration.push({ questionSetId: setId });
          }
        }
      }

      const quizData = {
        settings: {
          ...settings,
          examType,  // sent to backend so it knows to enforce 1-set or 4-set rules
        },
        questionSetCombination: validQuestionSetIds,
        batchConfiguration: batchConfiguration.length > 0 ? batchConfiguration : undefined,
      };

      console.log('Submitting quiz data:', quizData);

      const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create quiz');
      }

      const result = await response.json();
      console.log('Quiz created successfully:', result);
      alert('Quiz created successfully!');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    const selectedSets = selectedQuestionSetIds
      .filter(id => id !== null)
      .map(id => availableQuestionSets.find(qs => qs._id === id))
      .filter(Boolean);

    sessionStorage.setItem('quizPreview', JSON.stringify({ settings, questionSets: selectedSets }));
    window.open('/quiz/preview', '_blank');
  };

  const handleQuestionSetChange = async (index: number, questionSetId: string | null) => {
    const newSelectedIds = [...selectedQuestionSetIds];
    newSelectedIds[index] = questionSetId;
    setSelectedQuestionSetIds(newSelectedIds);

    const newBatchSelections = [...batchSelections];
    if (questionSetId) {
      const questionSet = availableQuestionSets.find(qs => qs._id === questionSetId);

      if (questionSet?.usesBatches) {
        const batches = await fetchBatchesForQuestionSet(questionSetId);

        setAvailableQuestionSets(prev =>
          prev.map(qs => qs._id === questionSetId ? { ...qs, batches } : qs)
        );

        // Auto-select first batch if available
        if (batches.length > 0) {
          newBatchSelections[index] = {
            questionSetId,
            batchNumber: batches[0].batchNumber,
          };
        } else {
          newBatchSelections[index] = null;
        }
      } else {
        newBatchSelections[index] = null;
      }
    } else {
      newBatchSelections[index] = null;
    }

    setBatchSelections(newBatchSelections);
  };

  const handleBatchChange = (index: number, batchNumber: number | null) => {
    const newBatchSelections = [...batchSelections];
    const questionSetId = selectedQuestionSetIds[index];

    if (questionSetId && batchNumber) {
      newBatchSelections[index] = { questionSetId, batchNumber };
    } else {
      newBatchSelections[index] = null;
    }

    setBatchSelections(newBatchSelections);
  };

  // ─── Stats ───────────────────────────────────────────────────────────────────

  const getTotalStats = () => {
    let totalQuestions = 0;
    let totalPoints = 0;
    let selectedCount = 0;

    for (let i = 0; i < selectedQuestionSetIds.length; i++) {
      const setId = selectedQuestionSetIds[i];
      if (!setId) continue;

      const questionSet = availableQuestionSets.find(qs => qs._id === setId);
      if (!questionSet) continue;

      selectedCount++;

      if (questionSet.usesBatches) {
        const batchSelection = batchSelections[i];
        if (batchSelection?.batchNumber) {
          const batch = questionSet.batches?.find(b => b.batchNumber === batchSelection.batchNumber);
          if (batch) {
            totalQuestions += batch.questionCount;
            totalPoints += batch.totalPoints;
          }
        }
      } else {
        totalQuestions += questionSet.questionCount;
        totalPoints += questionSet.totalPoints;
      }
    }

    return { totalQuestions, totalPoints, selectedCount };
  };

  const stats = getTotalStats();
  const isSelectionComplete = stats.selectedCount === expectedCount;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Create Quiz</h1>
          </div>
          <button
            onClick={handlePreview}
            disabled={!isSelectionComplete}
            className="flex items-center px-6 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-5 h-5 mr-2 text-blue-bg" />
            <span className="font-medium text-blue-bg">Preview</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-2">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`w-full px-4 py-4 text-left font-semibold rounded-lg transition-colors ${
                  activeTab === 'details' ? 'bg-blue-bg text-white' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Quiz Details
              </button>
              <button
                onClick={() => {
                  if (validateQuizDetails()) {
                    setActiveTab('question-sets');
                  } else {
                    alert('Please complete quiz details first');
                  }
                }}
                className={`w-full px-4 py-4 text-left font-semibold rounded-lg transition-colors ${
                  activeTab === 'question-sets' ? 'bg-blue-bg text-white' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Question Sets
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mt-8 p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Details</span>
                  <span className={settings.title ? 'text-green-600' : 'text-gray-400'}>
                    {settings.title ? '✓' : '○'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Question Sets</span>
                  <span className={isSelectionComplete ? 'text-green-600' : 'text-gray-400'}>
                    {isSelectionComplete ? '✓' : `${stats.selectedCount}/${expectedCount}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Quiz Statistics */}
            {stats.selectedCount > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg shadow">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Quiz Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sets:</span>
                    <span className="font-medium">{stats.selectedCount}/{expectedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{stats.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Points:</span>
                    <span className="font-medium">{stats.totalPoints}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="col-span-10">
            {activeTab === 'details' && (
              <div>
                <QuizSettingsComponent
                  settings={settings}
                  onSettingsChange={setSettings}
                />

                {/* Exam Type Selector */}
                <div className="bg-white rounded-lg shadow p-6 mt-4">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Exam Type</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Single-subject exams contain one question set and are assigned only to
                    students who offer that subject. Multi-subject exams require four question sets.
                  </p>
                  <div className="flex gap-3">
                    {(['multi-subject', 'single-subject'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleExamTypeChange(type)}
                        className={`px-5 py-2 rounded-lg font-medium border-2 transition-colors ${
                          examType === type
                            ? 'bg-blue-bg text-white border-blue-bg'
                            : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type === 'multi-subject' ? 'Multi-Subject' : 'Single-Subject'}
                      </button>
                    ))}
                  </div>
                  {examType === 'single-subject' && (
                    <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                      ⚠️ Switching exam type will clear your current question set selection.
                    </p>
                  )}
                </div>

                {/* Error display */}
                {errors.title && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {errors.title}
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="px-6 py-2 my-6 bg-blue-bg text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Next
                </button>
              </div>
            )}

            {activeTab === 'question-sets' && (
              <div>
                <QuestionSetsSelector
                  availableQuestionSets={availableQuestionSets}
                  selectedQuestionSetIds={selectedQuestionSetIds}
                  batchSelections={batchSelections}
                  onQuestionSetChange={handleQuestionSetChange}
                  onBatchChange={handleBatchChange}
                  isLoading={isLoadingQuestionSets}
                  onRefresh={fetchQuestionSets}
                  examType={examType}
                />

                {/* Error display */}
                {errors.questionSets && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {errors.questionSets}
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isSelectionComplete}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}