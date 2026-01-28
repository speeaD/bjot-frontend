/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ArrowLeft, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuizSettingsComponent from "../componets/QuizSettings";
import QuestionSetsSelector from "../componets/QuestionSetsSelector";
import { QuizSettings }  from "../types/global";

interface QuestionSet {
  _id: string;
  title: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
  createdAt: string;
}

interface CreateQuizClientProps {
  user?: any;
}

export default function CreateQuizClient({ }: CreateQuizClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'question-sets'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableQuestionSets, setAvailableQuestionSets] = useState<QuestionSet[]>([]);
  const [isLoadingQuestionSets, setIsLoadingQuestionSets] = useState(false);

  const [settings, setSettings] = useState<QuizSettings>({
    coverImage: '',
    title: '',
    description: '',
    instructions: '',
    isQuizChallenge: false,
    duration: { hours: 0, minutes: 30, seconds: 0 },
    shuffleQuestions: true,
    multipleAttempts: true,
    requireLogin: true,
    permitLoseFocus: true,
    viewAnswer: true,
    viewResults: true,
    displayCalculator: false,
    isOpenQuiz: false
  });

  // Array of exactly 4 question set IDs
  const [selectedQuestionSetIds, setSelectedQuestionSetIds] = useState<(string | null)[]>([
    null, null, null, null
  ]);

  // Fetch available question sets
  useEffect(() => {
    fetchQuestionSets();
  }, []);

  const fetchQuestionSets = async () => {
    try {
      setIsLoadingQuestionSets(true);
      const response = await fetch('/api/questionset', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch question sets');
      }

      const data = await response.json();
      setAvailableQuestionSets(data.questionSets || []);
    } catch (error) {
      console.error('Error fetching question sets:', error);
      alert('Failed to load question sets');
    } finally {
      setIsLoadingQuestionSets(false);
    }
  };

  // Validation
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
    console.log('Selected question set IDs:', selectedQuestionSetIds, 'Count:', selectedCount);
    
    if (selectedCount !== 4) {
      newErrors.questionSets = 'You must select exactly 4 question sets';
    }

    // Check for duplicates
    const uniqueSets = new Set(selectedQuestionSetIds.filter(id => id !== null));
    if (uniqueSets.size !== selectedCount) {
      newErrors.questionSets = 'You cannot select the same question set multiple times';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      alert('Please select exactly 4 different question sets');
      return;
    }

    if (!validateQuizDetails()) {
      alert('Please go back and fix quiz details');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Filter out null values and ensure we have exactly 4 IDs
      const validQuestionSetIds = selectedQuestionSetIds.filter(id => id !== null) as string[];
      
      if (validQuestionSetIds.length !== 4) {
        throw new Error('Must select exactly 4 question sets');
      }

      // FIXED: Changed from 'questionSetIds' to 'questionSetCombination'
      const quizData = {
        settings,
        questionSetCombination: validQuestionSetIds
      };

      console.log('Submitting quiz data:', quizData);

      const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create quiz');
      }

      const result = await response.json();
      console.log('Quiz created successfully:', result);
      alert('Quiz created successfully!');
      router.push('/'); // Redirect to home page or quiz list
      router.refresh();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    // Get selected question sets details for preview
    const selectedSets = selectedQuestionSetIds
      .filter(id => id !== null)
      .map(id => availableQuestionSets.find(qs => qs._id === id))
      .filter(Boolean);

    sessionStorage.setItem('quizPreview', JSON.stringify({ 
      settings, 
      questionSets: selectedSets 
    }));
    window.open('/quiz/preview', '_blank');
  };

  const handleQuestionSetChange = (index: number, questionSetId: string | null) => {
    const newSelectedIds = [...selectedQuestionSetIds];
    newSelectedIds[index] = questionSetId;
    setSelectedQuestionSetIds(newSelectedIds);
  };

  // const getSelectedSetDetails = (index: number): QuestionSet | null => {
  //   const id = selectedQuestionSetIds[index];
  //   if (!id) return null;
  //   return availableQuestionSets.find(qs => qs._id === id) || null;
  // };

  const getTotalStats = () => {
    const selectedSets = selectedQuestionSetIds
      .map(id => id ? availableQuestionSets.find(qs => qs._id === id) : null)
      .filter(Boolean) as QuestionSet[];

    return {
      totalQuestions: selectedSets.reduce((sum, set) => sum + set.questionCount, 0),
      totalPoints: selectedSets.reduce((sum, set) => sum + set.totalPoints, 0),
      selectedCount: selectedSets.length
    };
  };

  const stats = getTotalStats();

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
            disabled={stats.selectedCount !== 4}
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
                  activeTab === 'details'
                    ? 'bg-blue-bg text-white'
                    : 'text-gray-700 hover:bg-gray-50'
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
                  activeTab === 'question-sets'
                    ? 'bg-blue-bg text-white'
                    : 'text-gray-700 hover:bg-gray-50'
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
                  <span className={stats.selectedCount === 4 ? 'text-green-600' : 'text-gray-400'}>
                    {stats.selectedCount === 4 ? '✓' : `${stats.selectedCount}/4`}
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
                    <span className="font-medium">{stats.selectedCount}/4</span>
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
                  onQuestionSetChange={handleQuestionSetChange}
                  isLoading={isLoadingQuestionSets}
                  onRefresh={fetchQuestionSets}
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
                    disabled={isSubmitting || stats.selectedCount !== 4}
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